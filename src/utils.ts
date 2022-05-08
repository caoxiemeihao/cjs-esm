export function isCommonjs(code: string) {
  const multilineCommentsRE = /\/\*(.|[\r\n])*?\*\//gm
  const singlelineCommentsRE = /\/\/.*/g

  // Avoid matching the content of the comment
  code = code
    .replace(multilineCommentsRE, '')
    .replace(singlelineCommentsRE, '')
  return /\b(?:require|module|exports)\b/.test(code)
}
