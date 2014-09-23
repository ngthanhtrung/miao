'use strict';

var path = require('path');
var fs = require('fs');

var glob = require('glob');
var yaml = require('js-yaml');

var toString = Object.prototype.toString;
var isArray = Array.isArray;
var defineProperty = Object.defineProperty;
var keys = Object.keys;
var slice = [].slice;

exports.isString = function (value) {
  return toString.call(value) === '[object String]';
};

exports.isObject = function (value) {
  return (value && typeof value === 'object');
};

exports.isGeneratorFunction = function (value) {
  return (typeof value === 'function' &&
    value.constructor.name === 'GeneratorFunction');
};

exports.constant = function (object, key, value) {
  defineProperty(object, key, { value: value });
};

exports.values = function (object) {
  return keys(object).map(function (key) {
    return object[key];
  });
};

exports.hashtable = function (values) {
  var ret = {};

  values.forEach(function (value, index) {
    ret[value] = index;
  });

  return ret;
};

exports.requireIfExists = function (path) {
  try {
    require.resolve(path);
  }
  catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return;
    }

    throw err;
  }

  return require(path);
};

exports.invokeDirectory = function (dir) {
  var pattern = path.join(dir, '**/*.js');
  var args = slice.call(arguments, 1);

  var paths = glob.sync(pattern);
  var methods = paths.map(require);

  return methods.map(function (method) {
    return method.apply(this, args);
  }, this);
};

exports.loadYAML = function *(path, options) {
  var content = yield function (cb) {
    fs.readFile(path, 'utf8', cb);
  };

  return yaml.safeLoad(content, options);
};

exports.loadYAMLSync = function (path, options) {
  var content = fs.readFileSync(path, 'utf8');
  return yaml.safeLoad(content, options);
};

exports.stick = function (ctor, args, keys) {
  if (!isArray(args)) {
    args = [ args ];
  }

  if (!isArray(keys)) {
    keys = (keys ? [ keys ] : []);
  }

  args.unshift(null);

  var sticked = ctor.bind.apply(ctor, args);
  var hashtable = exports.hashtable(keys);

  sticked.prototype = ctor.prototype;

  for (var key in ctor) {
    if (ctor.hasOwnProperty(key)) {
      var value = ctor[key];

      if (hashtable[key]) {
        value = exports.stick(value, args);
      }

      sticked[key] = value;
    }
  }

  return sticked;
};
