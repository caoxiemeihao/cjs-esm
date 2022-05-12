import MagicString, { SourceMap } from 'magic-string'
import { isCommonjs } from './utils'
import { analyzer, TopScopeType } from './analyze'
import { generateImport } from './generate-import'
import { generateExport } from './generate-export'

export interface Result {
  code: string
  map?: SourceMap
}

export default function cjs2esm(code: string): Result {
  if (!isCommonjs(code)) {
    return { code }
  }

  const analyzed = analyzer(code)
  const imports = generateImport(analyzed)
  const exportRuntime = generateExport(analyzed)

  const promotionImports = []
  const ms = new MagicString(code)

  // Replace require statement
  for (const impt of imports) {
    const {
      node,
      importee: imptee,
      declaration,
      importName,
      topScopeNode,
      functionScopeNode,
    } = impt
    const importee = imptee + ';'

    let importStatement: string
    if (topScopeNode) {
      if (topScopeNode.type === TopScopeType.ExpressionStatement) {
        importStatement = importee
      } else if (topScopeNode.type === TopScopeType.VariableDeclaration) {
        importStatement = declaration ? `${importee} ${declaration};` : importee
      }
    } else if (functionScopeNode) {
      // 🚧-①: 🐞
      ms.overwrite(node.callee.start, node.callee.end, 'import/*🚧-🐞*/')
      ms.appendRight(node.end, '.then(m => m.default || m)')
    } else {
      // TODO: Merge duplicated require id
      promotionImports.push(importee)
      importStatement = importName
    }

    if (importStatement) {
      const start = topScopeNode ? topScopeNode.start : node.start
      const end = topScopeNode ? topScopeNode.end : node.end
      ms.overwrite(start, end, importStatement)
    }
  }

  if (promotionImports.length) {
    ms.prepend(['/* import-promotion-S */', ...promotionImports, '/* import-promotion-E */'].join(' '))
  }

  // Replace exports statement
  if (exportRuntime) {
    let moduleRuntime = 'const module = { exports: {} }; const exports = module.exports;'

    if (exportRuntime.exportDefault) {
      const { nodes, name } = exportRuntime.exportDefault
      moduleRuntime += ` let ${name} = undefined;`
      for (const node of nodes) {
        ms.appendLeft(node.start, `${name} = `)
      }
    }

    const polyfill = ['/* export-runtime-S */', moduleRuntime, '/* export-runtime-E */'].join(' ')
    const _exports = [
      '\n// --------- export-statement ---------',
      exportRuntime.exportDefault?.statement,
      exportRuntime.exportMembers,
    ].filter(Boolean).join('\n')
    ms.prepend(polyfill).append(_exports)
  }

  return {
    code: ms.toString(),
    map: ms.generateMap({ hires: true }),
  }
}
