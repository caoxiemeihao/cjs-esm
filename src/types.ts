import acorn from 'acorn'
import { DEFAULT_EXTENSIONS } from './utils'

export interface CommonJsOptions {
  code: string
  sourcemap?: boolean
  extensions?: string[] | ((exts: typeof DEFAULT_EXTENSIONS) => string[])
}

declare global {
  export type KV<V = unknown> = Record<string, V>

  export type AcornNode = acorn.Node & KV<any>
}
