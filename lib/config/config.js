'use strict';

var clone = require('clone');
var extend = require('extend');
var except = require('except');

var miao = require('../miao');
var util = require('../util');

exports = module.exports = function *(miao) {
  var config = yield load(
    miao.constant.path.CONFIG,
    miao.env
  );

  return extend(
    true,
    {},
    clone(exports.default),
    config
  );
};

exports.default = util.loadYAMLSync(
  __dirname + '/default.yml'
);

function *load(path, env) {
  var data;

  try {
    data = yield util.loadYAML(path);
  }
  catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (!util.isObject(data)) {
    return {};
  }

  var environments = util.values(miao.environment);

  return extend(
    true,
    except(data, environments),
    data[env]
  );
}
