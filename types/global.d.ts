import acorn from 'acorn'

declare global {
  type KV = Record<string, unknown>
  
  type KV_ANY = Record<string, any>
  
  type AcornNodeExt = acorn.Node & KV_ANY
}
