import MagicString, { SourceMap } from 'magic-string'
import { isCommonjs } from './utils'
import { analyzer, TopLevelType } from './analyze'
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
      topLevelNode,
      importee: imptee,
      declaration,
      importName,
    } = impt
    const importee = imptee + ';'

    let importStatement: string
    if (topLevelNode) {
      if (topLevelNode.type === TopLevelType.ExpressionStatement) {
        importStatement = importee
      } else if (topLevelNode.type === TopLevelType.VariableDeclaration) {
        importStatement = declaration ? `${importee} ${declaration};` : importee
      }
    } else {
      // TODO: Merge duplicated require id
      // 🚧-①
      promotionImports.push(importee)
      importStatement = importName
    }

    if (importStatement) {
      const start = topLevelNode ? topLevelNode.start : node.start
      const end = topLevelNode ? topLevelNode.end : node.end
      ms.overwrite(start, end, importStatement)
    }
  }

  if (promotionImports.length) {
    ms.prepend(['/* import-promotion-S */', ...promotionImports, '/* import-promotion-E */'].join(' '))
  }

  // Replace exports statement
  if (exportRuntime) {
    if (exportRuntime.exportDefault) {
      const { start } = exportRuntime.exportDefault.node
      ms.appendRight(start, `const ${exportRuntime.exportDefault.name} = `)
    }

    const polyfill = ['/* export-runtime-S */', exportRuntime.polyfill, '/* export-runtime-E */'].join(' ')
    const _exports = [
      '// --------- export-statement ---------',
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
