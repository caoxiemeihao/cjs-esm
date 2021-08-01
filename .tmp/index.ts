import { createContext, CreateContextOptions } from './context'
import { createAnalyzer } from './analyzer'
import { createWriter } from './writer'

function transform(options: CreateContextOptions) {
  const context = createContext(options)
  const analyzer = createAnalyzer(context)

  try {
    analyzer.analyze()
  } catch (error) {
    if (error.pos === null && context.node) {
      error.pos = context.node.start
    }
    throw error
  }
  if (
    !context.moduleNodes.length &&
    !context.requireNodes.length &&
    !context.exportsNodes.length
  ) {
    return Promise.resolve({
      code: context.code,
      map: null,
      isTouched: false,
    })
  }

  return createWriter(context).write()
    .then(() => ({
      code: context.s.toString(),
      map: options.sourceMap ? context.s.generateMap({ hires: true }) : null,
      isTouched: true,
      context,
    }))
}

export { transform }
