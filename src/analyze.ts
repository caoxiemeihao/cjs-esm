import walk from 'acorn-walk'
import { Context } from './context'
import { AcornNode } from './types'

export interface Analyze { }

export function createAnalyze(context: Context) {
  return { analyze }

  function analyze() {
    walk.ancestor(context.ast, {
      CallExpression(node, ancestors, c) {
        console.log(node)
        console.log(ancestors)
        console.log(c)

        analyzeNode(node, ancestors as any)
      },
    })

  }

  function analyzeNode(node: AcornNode, ancestor: AcornNode[]) {

  }
}
