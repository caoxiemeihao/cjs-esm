import acorn from 'acorn'

export type KV<V = unknown> = Record<string, V>

export type AcornNode = acorn.Node & KV<any>
