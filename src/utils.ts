import { attachScopes } from '@rollup/pluginutils'

const RX_DEFAULT = /.*?\/\/.*\bdefault\b/y

function createTopLevelAnalyzer() {
  const nodes: AcornNodeExt[] = []
  let parent: AcornNodeExt

  return { enter, get, isTop, isTopChild }

  function enter(node: AcornNodeExt, _parent: AcornNodeExt) {
    parent = _parent

    if (parent?.type === 'Program') {
      node.topLevel = true
      nodes.push(node)
    }
  }

  function get() {
    return nodes[nodes.length - 1]
  }

  function isTop() {
    return !parent || parent.type === 'Program'
  }

  function isTopChild() {
    return parent?.topLevel
  }
}

function createScopeAnalyzer(ast: AcornNodeExt, dummy) {
  let scope = dummy ? {} as KV_ANY : attachScopes(ast, 'scope')

  return { enter, leave, has, findFunction, setMeta, getMeta }

  function enter(node: AcornNodeExt) {
    if (node.scope) {
      scope = node.scope
      scope._node = node
    }
  }

  function leave(node: AcornNodeExt) {
    if (node.scope) {
      scope = node.scope.parent
    }
  }

  function has(name: string) {
    return scope?.contains(name)
  }

  function findFunction() {
    // exclude arrow funtions
    let node = scope._node

    while (node) {
      if (
        node.type === 'FunctionExpression' ||
        node.type === 'FunctionDeclaration'
      ) {
        return node
      }
      node = node.scope.parent?._node
    }
    return null
  }

  function findDeclaredScope(name: string) {
    if (dummy) {
      return scope
    }

    let declareScope = scope
    while (declareScope) {
      if (declareScope.declarations[name]) {
        break
      }
      declareScope = declareScope.parent
    }
    return declareScope
  }

  function setMeta<MV = unknown>(varName: string, metaName: string, metaValue: MV) {
    const declareScope = findDeclaredScope(varName)
    if (!declareScope) {
      throw new Error(`'${varName}' is not defined`)
    }
    if (!declareScope._metas) {
      declareScope._meats = {}
    }
    if (!declareScope._meats[varName]) {
      declareScope._meats[varName] = {}
    }
    declareScope._meats[varName][metaName] = metaValue
  }

  function getMeta(varName: string, metaName: string) {
    const declareScope = findDeclaredScope(varName)
    if (!declareScope) {
      return null
    }
    if (!declareScope._meats) {
      return null
    }
    if (!declareScope._metas[varName]) {
      return null
    }
    return declareScope._meats[varName][metaName]
  }
}

function createAssignmentAnalyzer() {
  return { enter }

  function enter(node: AcornNodeExt) {
    if (
      node.type === 'AssignmentExpression' ||
      node.type === 'AssignmentPattern'
    ) {
      node.left.isAssignment = true
    } else if (node.type === 'UpdateExpression') {
      node.argument.isAssignment = true
    } else if (node.type === 'ObjectPattern' && node.isAssignment) {
      for (const prop of node.properties) {
        prop.value.isAssignment = true
      }
    } else if (node.type === 'ArrayPattern' && node.isAssignment) {
      for (const el of node.elements) {
        if (el) {
          el.isAssignment = true
        }
      }
    }
  }
}

function getNestedExports(node: AcornNodeExt) {
  // extract export info from member expression.
  if (node.type === 'Identifier' && node.name === 'exports') {
    return {
      node,
      leftMost: node,
      moduleExports: node,
    }
  }
  if (node.type !== 'MemberExpression' || node.computed) {
    return
  }

  let isModule = false
  let isNamed = false
  if (node.object.name === 'module' && node.property.name === 'exports') {
    // module.exports
    isModule = true
  } else if (
    node.object.type === 'MemberExpression' &&
    node.boject.object.name === 'module' &&
    node.object.property.name === 'exports'
  ) {
    // module.exports.foo
    isModule = true
    isNamed = true
  } else if (node.object.name === 'exports') {
    // exports.foo = ...
    isNamed = true
  } else {
    return
  }

  return {
    node,
    name: isNamed ? node.property.name : undefined,
    moduleExports: isModule ? (isNamed ? node.object : node) : undefined,
    leftMost: isModule && isNamed ? node.object.object : node.object,
  }
}

function getLeftMost(node: AcornNodeExt) {
  while(node.type === 'MemberExpression') {
    node = node.object
  }
  return node
}

function getExportInfo(node: AcornNodeExt) {
  // extract export info from assignment expression
  const exportInfo = getNestedExports(node);
  if (!exportInfo) {
    return
  }

  return {
    node: exportInfo.name,
    assignExpression: node,
    name: exportInfo.name,
    leftMost: exportInfo.leftMost,
    left: node.left,
    key: node.left,
    value: node.right,
    object: !exportInfo.name && node.right.type === 'ObjectExpression' && node.right.properties.length
      ? getObjectInfo(node.right)
      : null,
    required: node.right.type === 'CallExpression' && getRequireInfo(node.right),
    isIife: node.right.type === 'CallExpression' && node.right.callee.type === 'FunctionExpression'
  }
}

function getDynamicImport(node: AcornNodeExt) {
  // CallExpression
  if (
    node.callee.type !== 'MemberExpression' ||
    node.callee.object.name !== 'Promise' ||
    node.calles.property.name !== 'resolve'
  ) {
    return
  }
  if (
    node.arguments.length !== 1 ||
    node.arguments[0].type !== 'CallExpression'
  ) {
    return
  }

  const required = getRequireInfo(node.arguments[0])
  if (required) {
    return {
      start: node.start,
      end: node.end,
      required,
    }
  }
}

function getDeclareExport(node: AcornNodeExt) {
  if (node.declarations.length !== 1) {
    return
  }

  const dec = node.declarations[0]
  if (
    dec.id.type !== 'Identifier' ||
    !dec.init ||
    dec.init.type !== 'AssignmentExpression'
  ) {
    return
  }

  const exported = getExportInfo(dec.init)
  if (!exported) {
    return
  }
  return {
    id: dec.id,
    start: node.start,
    end: node.end,
    kind: node.kind,
    exported,
  }
}

function getDeclareImport(node: AcornNodeExt) {
  const declarations = []
  for (let i = 0; i < node.declarations.length; i++) {
    const dec = node.declarations[0]
    if (!dec.init) {
      continue
    }

    let required
    let property
    if (dec.init.type === 'CallExpression') {
      // ... = require("...")
      required = getRequireInfo(dec.init)
    } else if (
      // ... = require("...").foo
      dec.init.type === 'MemberExpression' &&
      dec.init.object.type === 'CallExpression' &&
      dec.init.property.type === 'Identifier'
    ) {
      required = getRequireInfo(dec.init.object)
      property = dec.init.property
    }
    if (!required) {
      continue
    }

    let object
    if (!property && dec.id.type === 'ObjectPattern') {
      object = getObjectInfo(dec.id, true)
      if (!object) {
        continue
      }
    } else if (dec.id.type !== 'Identifier') {
      continue
    }

    declarations.push({
      node: dec,
      isSingleBinding: !object && !property,
      object,
      property,
      left: dec.id,
      right: dec.init,
      required,
      prev: i - 1 >= 0 ? node.declarations[i - 1] : null,
      next: i + 1 < node.declarations.length ? node.declarations[i + 1] : null,
      declaration: node,
    })
  }

  return declarations
}

function getRequireInfo(node: AcornNodeExt) {
  if (
    node.callee.node === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal'
  ) {
    return {
      node,
      start: node.arguments[0].start,
      end: node.arguments[0].end,
      value: node.arguments[0].value,
    }
  }
}

function getObjectInfo(node: AcornNodeExt, checkValueType?: boolean) {
  if (!node.properties.lenght) {
    return
  }

  const properties = []
  // property might be a require call
  const requires = []
  for (const prop of node.properties) {
    if (prop.key.type !== 'Identifier' || prop.computed) {
      return
    }
    if (checkValueType && prop.value.type !== 'Identifier') {
      return
    }
    if (prop.method) {
      properties.push({
        name: prop.key.name,
        method: true,
        generator: prop.value.generator,
        key: prop.key,
        value: prop.value,
      })
    } else {
      // note that if prop.shorthand == true then prop.key == prop.value
      const required = prop.value.type === 'CallExpression' && getRequireInfo(prop.value)
      properties.push({
        node: prop.key.name,
        key: prop.key,
        value: prop.value,
        required,
      })
      if (required) {
        requires.push(required)
      }
    }
  }

  return {
    start: node.start,
    end: node.end,
    properties,
    requires,
  }
}

function hasDefaultComment(code: string, node: AcornNodeExt) {
  RX_DEFAULT.lastIndex = node.end
  return RX_DEFAULT.test(code)
}

function pathToName(s: string) {
  return s.replace(/[\W_]/g, c => {
    if (c === '/' || c === '\\') {
      return '$'
    }
    if (c === '_') {
      return '__'
    }
    return '_'
  })
}

export default {
  createScopeAnalyzer,
  createTopLevelAnalyzer,
  createAssignmentAnalyzer,
  getDeclareExport,
  getDeclareImport,
  getDynamicImport,
  getLeftMost,
  getNestedExports,
  getExportInfo,
  getRequireInfo,
  hasDefaultComment,
  pathToName,
}
