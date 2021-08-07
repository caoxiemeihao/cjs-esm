import acorn from 'acorn'

export type KV<V = unknown> = Record<string, V>

export type AcornNode = acorn.Node & KV<any>


export interface BaseNode {
  type: string
  node: AcornNode
}

export interface VariableDeclaratorNode extends BaseNode {
  /** const acorn = require('acorn') */
  name?: string
  /** const { ancestor, simple } = require('acorn-walk') */
  names?: string[]
}

export interface CallExpressionNode extends BaseNode {
  ancestors: AcornNode[]
  require: string
  /** MemberExpression will have */
  property?: string
}

/**
 * VariableDeclarator === null 代表只是 require 引入 (import 'xxxx')
 */
export interface RequireStatement {
  VariableDeclarator: VariableDeclaratorNode | null
  CallExpression: CallExpressionNode | null
}

/**
 * 目前只考虑四种 require 情况 21-08-07
 * 1. 作为赋值表达式 | Statement        | const aconr = require('acorn')
 * 2. 只有引入      | Statement        | require('acorn')
 * 3. 作为对象属性值 | ObjectExpression | const obj = { acorn: require('acorn') }
 * 4. 作为数组成员   | ArrayExpression  | const arr = [require('acorn')]
 */
export interface RequireRecord {
  Statement: RequireStatement
  ObjectExpression: ObjectExpressionNode | null
  ArrayExpression: ArrayExpressionNode | null
}

export interface ObjectExpressionNode {
  Property: string
  CallExpression: CallExpressionNode
}

export interface ArrayExpressionNode {
  Index: number
  CallExpression: CallExpressionNode
}
