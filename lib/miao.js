'use strict';

var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var ms = require('ms');
var co = require('co');
var lruCache = require('lru-cache');

var defineProperty = Object.defineProperty;
var keys = Object.keys;

exports = module.exports = function (options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = null;
  }

  var miao = new exports.Miao(options);
  var bootstrap = miao.bootstrap();

  if (typeof cb === 'function') {
    return co(bootstrap)(cb);
  }

  return bootstrap;
};

exports.environment = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  PRODUCTION: 'production'
};

var Miao = exports.Miao = function (options) {
  if (!(this instanceof Miao)) {
    return new Miao(options);
  }

  EventEmitter.call(this);

  this.options = options || {};

  var basePath = this.options.base || process.cwd();
  this.constant = exports.constant(basePath);

  this.cache = lruCache({
    max: 10000,
    maxAge: ms('1 hour')
  });
};

inherits(Miao, EventEmitter);

exports.constant = require('./constant');

var util = exports.util = require('./util');

exports.config = require('./config/config');
exports.ds = require('./datasource');
exports.app = require('./app/app');

var miaoProto = Miao.prototype;

miaoProto.util = util;

miaoProto.bootstrap = function *() {
  yield this._init();
  this.emit('initialized');

  if (this.options.startup) {
    yield this.start();
    this.emit('started');
  }

  return this;
};

miaoProto._init = function *() {
  this._initEnv();

  var events = {
    'config': 'configuration',
    'ds': 'datasource',
    'app': 'application'
  };

  var namespaces = keys(events);

  for (var i = 0, len = namespaces.length; i < len; i++) {
    var ns = namespaces[i];
    var bootstrap = exports[ns];

    this[ns] = (util.isGeneratorFunction(bootstrap) ?
      yield bootstrap(this) : bootstrap(this));

    this.emit(events[ns]);
  }

  util.invokeDirectory(
    this.constant.path.INITIALIZERS,
    this
  );
};

miaoProto._initEnv = function () {
  var self = this;
  var environment = exports.environment;

  var env = this.options.env ||
    process.env.NODE_ENV ||
    environment.DEVELOPMENT;

  this.env = process.env.NODE_ENV = env;

  var defineShorthand = function (value) {
    defineProperty(self, value, {
      get: function () {
        return (this.env === value);
      }
    });
  };

  for (var key in environment) {
    defineShorthand(environment[key]);
  }
};

miaoProto.start = function *() {
  if (this.started) {
    return;
  }

  this.started = true;

  var host = this.config.host;
  var port = this.config.port;

  var app = this.app;

  yield function (cb) {
    app.listen(port, host, cb);
  };

  return this;
};
