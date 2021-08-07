import acorn from 'acorn'
import { AcornNode, KV } from './types'

export interface Context {
  ast: AcornNode
  code: string
  sourcemap?: string
  requires: KV<any>[]
  exports: KV<any>[]
}

export interface CreateContextOptions {
  code: string
  sourcemap?: boolean
}

export function createContext(options: CreateContextOptions) {
  const { code } = options
  const context: Context = {
    ast: acorn.parse(code, { ecmaVersion: 'latest' }),
    code,
    requires: [],
    exports: [],
  }

  return context
}
