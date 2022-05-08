import type { Node } from 'acorn'

export type AcornNode<T = any> = Node & Record<string, T>
