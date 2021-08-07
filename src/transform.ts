import {
  ArrayExpressionNode,
  ExportsRecord,
  ImportRecord,
  ObjectExpressionNode,
  RequireRecord,
  RequireStatement,
} from './types';

export interface TransformImportOptions {
  transformPre?: (arg0: RequireStatement | ArrayExpressionNode | ObjectExpressionNode) => typeof arg0 | void
  transformPost?: (importRecord: ImportRecord) => ImportRecord | void
}

/**
 * @todo import 去重合并 21-08-07
 */
export function transformImport(requires: RequireRecord[], options: TransformImportOptions = {}) {
  const statements = requires.filter(
    req => req.Statement.CallExpression
  ) as { Statement: RequireStatement }[]
  const expressions = requires.filter(
    req => req.ArrayExpression || req.ObjectExpression
  ) as {
    ArrayExpression: ArrayExpressionNode | null
    ObjectExpression: ObjectExpressionNode | null
  }[]
  let importCounter = 0
  const imports: ImportRecord[] = []

  for (const statement of statements) {
    if (options.transformPre) { // before transform hook
      statement.Statement = options.transformPre(statement.Statement) as RequireStatement
        ?? statement.Statement
    }
    const { Statement } = statement
    const { VariableDeclarator: VD, CallExpression: CE } = Statement
    const impt: ImportRecord = {}

    if (VD === null) {
      // require('acorn')
      impt.importOnly = {
        code: `import "${CE.require}"`,
        Statement,
      }
    } else if (VD.name) {
      if (CE.property) {
        if (CE.property === 'default') {
          // const acornDefault = require('acorn').default
          impt.importName = {
            name: VD.name,
            code: `import ${VD.name} from "${CE.require}"`,
            Statement,
          }
        } else {
          if (VD.name === CE.property) {
            // const parse = require('acorn').parse
            impt.importNames = {
              names: [CE.property],
              code: `import { ${CE.property} } from "${CE.require}}"`,
              Statement,
            }
          } else {
            // const alias = require('acorn').parse
            impt.importName = {
              name: { [CE.property]: VD.name },
              code: `import { ${CE.property} as ${VD.name} } from "${CE.require}"`,
              Statement,
            }
          }
        }
      } else {
        // const acorn = require('acorn')
        impt.importName = {
          name: { '*': VD.name },
          code: `import * as ${VD.name} from "${CE.require}"`,
          Statement,
        }
      }

    } else if (VD.names) {
      if (CE.property) {
        if (CE.property === 'default') {
          // const { ancestor, simple } = require('acorn-walk').default
          const moduleName = `_MODULE_default__${importCounter++}`
          impt.importDefaultDeconstruct = {
            name: moduleName,
            deconstruct: VD.names,
            codes: [
              `import ${moduleName} from "${CE.require}"`,
              `const { ${VD.names.join(', ')} } = ${moduleName}`,
            ],
            Statement,
          }
        } else {
          // const { ancestor, simple } = require('acorn-walk').other
          const moduleName = `_MODULE_name__${importCounter++}` // 防止命名冲突
          impt.importDeconstruct = {
            name: moduleName,
            deconstruct: VD.names,
            codes: [
              `import { ${CE.property} as ${moduleName} } from "${CE.require}"`,
              `const { ${VD.names.join(', ')} } = ${moduleName}`,
            ],
            Statement,
          }
        }
      } else {
        // const { ancestor, simple } = require('acorn-walk')
        impt.importNames = {
          names: VD.names,
          code: `import { ${VD.names.join(', ')} } from "${CE.require}"`,
          Statement,
        }
      }
    }

    imports.push(options.transformPost
      // after transform hook
      ? (options.transformPost(impt) as ImportRecord ?? impt)
      : impt)
  }

  for (const { ArrayExpression, ObjectExpression } of expressions) {
    let arrOrObj = ArrayExpression || ObjectExpression
    if (options.transformPre) { // before transform hook
      arrOrObj = options.transformPre(arrOrObj) as (ArrayExpressionNode | ObjectExpressionNode)
        ?? arrOrObj
    }
    const { CallExpression: CE } = arrOrObj
    const expType = typeof (arrOrObj as any).Index === 'number' ? 'ArrayExpression' : 'ObjectExpression'
    const impt: ImportRecord = {}

    if (CE.property === 'default') {
      const moduleName = `_MODULE_default__${expType}__${importCounter++}`
      impt.importDefaultExpression = {
        name: moduleName,
        code: `import ${moduleName} from "${CE.require}"`,
        ArrayExpression,
        ObjectExpression,
      }
    } else {
      // CallExpression.property === other 的情况当做 * as moduleName 处理，省的命名冲突
      const moduleName = `_MODULE_name__${expType}__${importCounter++}`
      impt.importExpression = {
        name: { '*': moduleName },
        code: `import * as ${moduleName} from "${CE.require}"`,
        ArrayExpression,
        ObjectExpression,
      }
    }

    imports.push(options.transformPost
      // after transform hook
      ? (options.transformPost(impt) as ImportRecord ?? impt)
      : impt)
  }

  return imports
}

// ------------------------------------------------

export interface TransformExporttOptions { }

export function transformExport(exports: ExportsRecord[], options: TransformExporttOptions = {}) {

}
