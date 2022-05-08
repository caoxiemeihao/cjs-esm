# cjs-esm

Another CommonJs transform ESModule lib.

[![NPM version](https://img.shields.io/npm/v/cjs-esm.svg?style=flat)](https://npmjs.org/package/cjs-esm)
[![NPM Downloads](https://img.shields.io/npm/dm/cjs-esm.svg?style=flat)](https://npmjs.org/package/cjs-esm)

English | [简体中文](https://github.com/caoxiemeihao/cjs-esm/blob/main/README.zh-CN.md)

## Usage

```js
import cjs2esm from 'cjs-esm'
// or
// const cjs2esm = require('cjs-esm').default

const { code, map } = cjs2esm(`const fs = require('fs')`)
```

## TODO

❌ Nested scope(function-scope)

❌ Dynamic require id

✅ require statement

```js
// Top-level scope
const foo = require('foo').default
↓
import foo from 'foo';

const foo = require('foo')
↓
import * as foo from 'foo';

const foo = require('foo').bar
↓
import * as __CJS_import__0__ from 'foo'; const { bar: foo } = __CJS_import__0__;

// Non top-level scope
const foo = [{ bar: require('foo').bar }]
↓
import * as __CJS_import__0__ from 'foo'; const foo = [{ bar: __CJS_import__0__.bar }]
```

✅ exports statement

```js
module.exports = fn() { };
↓
const __CJS__export_default__ = module.exports = fn() { };
export { __CJS__export_default__ as default }

exports.foo = 'foo';
↓
const __CJS__export_foo__ = (module.exports == null ? {} : module.exports).foo;
export { __CJS__export_foo__ as foo }
```
