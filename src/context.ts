import acorn from 'acorn'
import {
  createTopLevelAnalyzer,
  createScopeAnalyzer,
  createAssignmentAnalyzer,
  hasDefaultComment,
} from './utils'

export interface CreateContextOptions {
  code: string
  parse?: typeof acorn.parse
  ast?: AcornNodeExt
  sourceMap?: boolean
  importStyle?: string | ((moduleId: string) => string)
  exportStyle?: string | (() => string)
  nested?: boolean
  warn?: (message: string, pos: number) => void
}

function createContext(options: CreateContextOptions) {
  const context = Object.assign({}, options) as KV_ANY

  context.importStyleCache = new Map
  context.isImportPreferDefault = (id) => {
    if (context.importStyleCache.has(id)) {
      return Promise.resolve(context.importStyleCache.get(id))
    }
    if (typeof options.importStyle === 'function') {
      return Promise.resolve(options.importStyle(id))
        .then((style) => {
          const result = style === 'default'
          context.importStyleCache.set(id, result)
          return result
        })
    }

    const result = options.importStyle === 'default'
    context.importStyleCache.set(id, result)
    return Promise.resolve(result)
  }

  context.exportStyleCache = null
  context.isExportPreferDefault = () => {
    if (context.exportStyleCache !== null) {
      return Promise.resolve(context.exportStyleCache)
    }
    if (typeof options.exportStyle === 'function') {
      return Promise.resolve(options.exportStyle())
        .then((style) => {
          const result = style === 'default'
          context.exportStyleCache = result
          return Promise.resolve(result)
        })
    }

    const result = options.exportStyle === 'default'
    context.exportStyle = result
    return Promise.resolve(result)
  }

  if (!context.ast) {
    // original code | context.ast = options.parse(options.code)
    context.ast = options.parse(options.code, { ecmaVersion: 'latest' })
  }

  context.topLevel = createTopLevelAnalyzer()
  context.scope = createScopeAnalyzer(context.ast, !options.nested)
  context.assignment = createAssignmentAnalyzer()
  context.skip = () => {
    context.walkContext.skip()
    if (context.scope) {
      context.scope.leave(context.node)
    }
  }
  context.hasDefaultComment = (node: AcornNodeExt) => {
    return hasDefaultComment(context.code, node)
  }
  context.warn = (message: string, pos: number) => {
    if (options.warn) {
      if (pos === null && context.node) {
        pos = context.node.start
      }
      options.warn(message, pos)
    } else {
      console.error(message + (pos !== null ? ` at index ${pos}` : ''))
    }
  }

  return context
}

export { createContext }
