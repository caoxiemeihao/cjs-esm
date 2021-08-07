import { parse } from 'acorn'
import {
  AcornNode,
  KV,
  RequireRecord,
} from './types'

export interface Context {
  ast: AcornNode
  code: string
  sourcemap?: string
  requires: RequireRecord[]
  exports: KV<any>[]
}

export interface CreateContextOptions {
  code: string
  sourcemap?: boolean
}

export function createContext(options: CreateContextOptions) {
  const { code } = options
  const context: Context = {
    ast: parse(code, { ecmaVersion: 'latest' }),
    code,
    sourcemap: null,
    requires: [],
    exports: [],
  }

  return context
}
