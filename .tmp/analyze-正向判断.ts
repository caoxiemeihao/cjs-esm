import { ancestor } from 'acorn-walk'
import { Context } from './context'
import { AcornNode } from './types'

export interface Analyze { }

export function createAnalyze(context: Context) {
  return { analyze }

  function analyze() {
    ancestor<AcornNode>(context.ast, {
      CallExpression(node, ancestors) { // arguments[1] === arguments[2]
        if ((node as AcornNode).callee.name === 'require') {
          analyzeNode(node, ancestors as AcornNode[])
        }
      },
    })

  }

  function analyzeNode(_node: AcornNode, ancestors: AcornNode[]) {
    let parentIndex: number
    for (let len = ancestors.length, i = len - 1; i >= 0; i--) {
      // reverse lookup of the first parent element
      if (!['CallExpression', 'MemberExpression'].includes(ancestors[i].type)) {
        parentIndex = i
        break
      }
    }
    const parentNode = ancestors[parentIndex]
    const requireNode = ancestors[parentIndex + 1]

    for (const ancestor of ancestors) {
      // start processing from the specified location
      if (ancestor.type === 'VariableDeclaration') {
        /**
         * @TODO ingore multiple VariableDeclarator
         */
        const declaration = ancestor.declarations[0] as AcornNode
        const init = declaration.init as AcornNode
        switch (init.type) {
          case 'ArrayExpression':
            analyzeArrayExpression(requireNode, init)
            break
          case 'CallExpression':
            analyzeCallExpression(requireNode, init)
            break
          case 'MemberExpression':
            analyzeMemberExpression(requireNode, init)
            break
          case 'ObjectExpression':
            analyzeObjectExpression(requireNode, init)
            break
          default: break
        }
        break
      }
    }
  }

  function analyzeArrayExpression(requireNode: AcornNode, typedNode: AcornNode) { }

  function analyzeCallExpression(requireNode: AcornNode, typedNode: AcornNode) { }

  function analyzeMemberExpression(requireNode: AcornNode, typedNode: AcornNode) { }

  function analyzeObjectExpression(requireNode: AcornNode, typedNode: AcornNode) { }

}
