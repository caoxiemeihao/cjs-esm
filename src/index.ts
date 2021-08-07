import { Context, createContext } from './context'
import { createAnalyze } from './analyze'


export interface TransformeOptions {
  /**
   * @default false
   */
  sourcemap?: boolean
}

export interface Transformed {
  code: string | null
  sourcemap: string | null
  context: Context
}

export function transform(code: string, options?: TransformeOptions): Transformed {
  const context = createContext({ code })
  const analyze = createAnalyze(context)

  try {
    analyze.analyze()
  } catch (error) {
    throw error
  }

  return {
    code,
    sourcemap: null,
    context,
  }
}
