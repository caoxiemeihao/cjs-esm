import MagicString from 'magic-string'
import { createImportWriter } from './import-writer'
import { createExportWriter } from './export-writer'
import { Context } from './context'

function createWriter(context: Context) {
  context.s = new MagicString(context.code)
  context.safeOverwrite = (start, end, text) => {
    if (start !== end) {
      context.s.overwrite(start, end, text)
    } else {
      context.s.appendLeft(start, text)
    }
  }

  return { write }

  function write() {
    return Promise.all([
      createImportWriter(context).write(),
      createExportWriter(context).write(),
    ])
  }
}

export { createWriter }
