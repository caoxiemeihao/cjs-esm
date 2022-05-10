import {
  Analyzed,
  RequireStatement,
  TopScopeType,
} from './analyze'
import { AcornNode } from './types'

/**
 * At present, the `require` is divided into two cases
 * 目前，将 require 分为两种情况
 * 
 * At top level scope and can be converted into an `import` (🎯-①)
 * 在顶级作用域，并且可以转换成 import
 * 
 * At non top level scope, the `require` will be promoted
 * 不在顶级作用域，require 将会被提升
 * 
 * At non top level scope and in the function scope, tt will be converted into `import()` (🚧-①: 🐞)
 * 不在顶级作用域在函数作用域中，require 将会转换成 import()
 */

export interface ImportRecord {
  node: AcornNode
  importee: string
  // e.g
  // const ast = require('acorn').parse()
  // ↓↓↓↓ generated ↓↓↓↓
  // import * as __CJS_import__0__ from 'acorn'
  // ↓↓↓↓ declaration ↓↓↓↓
  // const ast = __CJS_import__0__.parse()
  declaration?: string
  // Auto generated name
  // e.g. __CJS_import__0__
  importName?: string
  topScopeNode?: RequireStatement['topScopeNode']
  functionScopeNode?: AcornNode

  // ==============================================

  // const acorn(identifier) = require('acorn')
  _identifier?: string
  // const { parse(properties) } = require('acorn')
  _properties?: Record<string, string>
  // const alias = require('acorn').parse(members)
  _members?: string[]
}

export function generateImport(analyzed: Analyzed) {
  const imports: ImportRecord[] = []
  let count = 0

  for (const req of analyzed.require) {
    const {
      node,
      ancestors,
      topScopeNode: topLevelNode,
      functionScopeNode: functionScope,
    } = req

    const impt: ImportRecord = {
      node,
      importee: '',
      topScopeNode: topLevelNode,
      functionScopeNode: functionScope,
    }
    const importName = `__CJS__promotion__import__${count++}__`

    // TODO: Dynamic require id, e.g. require('path/' + filename)
    let requireId: string
    const requireIdNode = node.arguments[0]
    // There may be no requireId `require()`
    if (!requireIdNode) continue
    if (requireIdNode.type === 'Literal') {
      requireId = requireIdNode.value
    }

    if (!requireId && !functionScope) {
      throw new Error(`Not supported statement: ${analyzed.code.slice(node.start, node.end)}`)
    }

    if (topLevelNode) {
      switch (topLevelNode.type) {
        case TopScopeType.ExpressionStatement:
          // TODO: With members
          impt.importee = `import '${requireId}'`
          break

        case TopScopeType.VariableDeclaration:
          // TODO: Multiple declaration
          const VariableDeclarator = topLevelNode.declarations[0]
          const { /* Left */id, /* Right */init } = VariableDeclarator as AcornNode

          let LV: string | { key: string, value: string }[]
          if (id.type === 'Identifier') {
            LV = id.name
          } else if (id.type === 'ObjectPattern') {
            LV = []
            for (const { key, value } of id.properties) {
              LV.push({ key: key.name, value: value.name })
            }
          }

          if (init.type === 'CallExpression') {
            if (typeof LV === 'string') {
              // const acorn = require('acorn')
              impt.importee = `import * as ${LV} from '${requireId}'`
            } else {
              const str = LV
                .map(e => e.key === e.value ? e.key : `${e.key} as ${e.value}`)
                .join(', ')
              // const { parse } = require('acorn')
              impt.importee = `import { ${str} } from '${requireId}'`
            }
          } else if (init.type === 'MemberExpression') {
            const members: string[] = ancestors
              .filter(an => an.type === 'MemberExpression')
              .map(an => an.property.name)
            if (typeof LV === 'string') {
              if (members.length === 1) {
                if (members[0] === 'default') {
                  // const acorn = require('acorn').default
                  impt.importee = `import ${LV} from '${requireId}'`
                } else {
                  impt.importee = members[0] === LV
                    // const parse = require('acorn').parse
                    ? `import { ${LV} } from '${requireId}'`
                    // const parse2 = require('acorn').parse
                    : `import { ${members[0]} as ${LV} } from '${requireId}'`
                }
              } else {
                impt.importee = `import * as ${importName} from '${requireId}'`
                // const bar = require('id').foo.bar
                impt.declaration = `const ${LV} = ${importName}.${members.join('.')}`
              }
            } else {
              impt.importee = `import * as ${importName} from '${requireId}'`
              // const { bar } = require('id').foo
              impt.declaration = `const { ${LV.join(', ')} } = ${importName}.${members.join('.')}`
            }
          }
          break
      }
    } else if (functionScope) {
      // 🚧-①: 🐞 The `require()` will be convert to `import()`
    } else {
      // This is probably less accurate but is much cheaper than a full AST parse.
      impt.importee = `import * as ${importName} from '${requireId}'`
      impt.importName = importName
    }

    imports.push(impt)
  }

  return imports
}

// TODO
export function generateDynamicIdImport(analyzed: Analyzed) { }
