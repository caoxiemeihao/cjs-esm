import { Context, createContext } from './context'
import { createAnalyze } from './analyze'
import {
  createTransform,
  TransformExporttOptions,
  TransformImportOptions,
} from './transform'

export interface TransformeOptions {
  /**
   * @default false
   */
  sourcemap?: boolean
  transformImport?: TransformImportOptions
  transformExport?: TransformExporttOptions
}

export interface Transformed {
  code: string | null
  sourcemap: string | null
  context: Context
}

export function transform(code: string, options: TransformeOptions = {}): Transformed {
  const context = createContext({ code })
  const analyze = createAnalyze(context)

  try {
    analyze.analyze()
    createTransform(context, {
      transformImport: options.transformImport,
      transformExport: options.transformExport,
    }).transform()
  } catch (error) {
    throw error
  }

  return {
    code: context.transformedCode,
    sourcemap: context.sourcemap,
    context,
  }
}
