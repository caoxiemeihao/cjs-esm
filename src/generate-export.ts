import { Analyzed } from './analyze'
import { AcornNode } from './types'

export interface ExportsRuntime {
  exportDefault?: {
    nodes: AcornNode[]
    name: string
    statement: string
  }
  exportMembers?: string
}

export function generateExport(analyzed: Analyzed): ExportsRuntime | null {
  if (!analyzed.exports.length) {
    return null
  }

  let exportDefault: ExportsRuntime['exportDefault']
  const moduleExports = analyzed.exports
    .filter(exp => exp.token.left === 'module')
    .map(exp => exp.node)
  if (moduleExports.length) {
    const name = '__CJS__export_default__'
    exportDefault = {
      nodes: moduleExports,
      name,
      statement: `export { ${name} as default }`
    }
  }

  let members = analyzed.exports
    .map(exp => exp.token.right)
    .filter(member => member !== 'exports')
    .filter(member => member !== 'default')
  // Remove duplicate export
  members = [...new Set(members)]
  const membersDeclaration = members
    .map(m => `const __CJS__export_${m}__ = (module.exports == null ? {} : module.exports).${m};`)
  const exportMembers = `
${membersDeclaration.join('\n')}
export {
  ${members.map(m => `__CJS__export_${m}__ as ${m}`).join(',\n  ')}
}
`.trim()

  return {
    exportDefault,
    exportMembers,
  }
}
