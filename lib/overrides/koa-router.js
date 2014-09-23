'use strict';

var assert = require('assert');
var inherits = require('util').inherits;

var clone = require('clone');

var methods = require('methods');
var qs = require('qs');

var KoaRouter = require('koa-router');

var Miao = require('../miao').Miao;
var util = require('../util');

var keys = Object.keys;
var slice = [].slice;

var Router = exports.Router = function (miao) {
  var args = slice.call(arguments);

  if (miao instanceof Miao) {
    args.shift();
    util.constant(this, 'miao', miao);
  }

  KoaRouter.apply(this, args);
};

inherits(Router, KoaRouter);

var routerProto = Router.prototype;

methods.concat([ 'all', 'del' ])
  .forEach(function (method) {
    var handle = routerProto[method];

    routerProto[method] = function (name, path) {
      var args = slice.call(arguments);

      if (this.miao && (typeof path === 'function' || isDispatcherPath(path))) {
        args.unshift(null);
      }

      return handle.apply(this, args);
    };
  });

var register = routerProto.register;

routerProto.register = function(routeName, path) {
  var args = slice.call(arguments);

  if (this.miao) {
    var app = this.miao.app;

    routeName = (!Array.isArray(path) && routeName) || null;

    var head = (Array.isArray(path) ? 2 : 3);
    var tail = args.length;

    args = args.map(function (arg, i) {
      if (i < head || i >= tail || !util.isString(arg)) {
        return arg;
      }

      var parts = splitDispatcherPath(arg);
      var controllerPath = parts[0];
      var actionName = parts[1];

      var controller = app.controller(controllerPath);
      assert(controller, 'Controller not found!');

      var dispatcher = controller.handle(actionName);

      return function *(next) {
        this.controller = controllerPath;
        this.action = actionName;
        this.route = routeName;

        yield dispatcher.call(this, function *() {
          this.lastController = this.controller;
          this.lastAction = this.action;
          this.lastRoute = this.route;

          delete this.controller;
          delete this.action;
          delete this.route;

          yield next;

          this.controller = controllerPath;
          this.action = actionName;
          this.route = routeName;
        });

        delete this.controller;
        delete this.action;
        delete this.route;
      };
    });
  }

  var route = register.apply(this, args);
  route.url = routeUrl;

  return route;
};

function isDispatcherPath(path) {
  return util.isString(path) && ~path.indexOf('>');
}

function splitDispatcherPath(path) {
  var parts = path.split(/\s*>\s*/);
  assert(parts.length === 2, 'Bad dispatcher path!');
  return parts;
}

function routeUrl(params) {
  /* jshint validthis: true */

  var url = this.path;
  var remaining = {};

  if (typeof params !== 'object') {
    params = slice.call(arguments);
  }

  if (params instanceof Array) {
    for (var i = 0, len = params.length; i < len; i++) {
      url = url.replace(/:[^\/]+/, params[i]);
    }
  }
  else {
    remaining = clone(params);

    var replace = function (key) {
      url = url.replace(':' + key, function () {
        delete remaining[key];
        return params[key];
      });
    };

    for (var key in params) {
      replace(key);
    }
  }

  url.split('/').forEach(function(component) {
    url = url.replace(component, encodeURIComponent(component));
  });

  if (keys(remaining).length) {
    url = url + '?' + qs.stringify(remaining);
  }

  return url;
}
