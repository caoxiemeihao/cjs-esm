
require('path');
// v0.4.0
require('path').resolve();

try {
  // TODO
  require('uninstalled-external-module');
} catch (ignored) {
  /* ignore */
}

const fs = require('fs');
const readFile = require('fs').readFile;
const { stat, cp: cpAlias } = require('fs');

const modules = [
  require('@angular/core'),
  require('@angular/core').default.value,
];

const json = {
  a: require('./input'),
  b: require('./b').b(),
  c: [
  	require('./c'),
  ],
};

const routes = [
  {
    name: 'Home',
   	component: require('./Home.vue'),
  },
];

function load(path) {
  // v0.4.0
  require(path);
}

// v0.4.0
const load2 = path => require(path).default();

if (require('./if-id').func()) {
  // v0.4.0
  require('./if-id').foo.bar
}

// ---------------------

module.exports = function fn() { };

exports.foo = 'foo';
exports.foo = 'foo';

function fn2() {
  exports.bar = exports.foo;
}

const obj = { foo: 'foo' };

exports.obj = obj;
