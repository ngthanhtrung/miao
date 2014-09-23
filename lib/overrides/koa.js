'use strict';

var assert = require('assert');
var inherits = require('util').inherits;
var path = require('path');

var KoaApp = require('koa');

var Miao = require('../miao').Miao;
var util = require('../util');

var Controller = require('../app/controller').Controller;
var Router = require('./koa-router').Router;

var slice = [].slice;

var App = exports.App = function (miao) {
  var args = slice.call(arguments);

  if (miao instanceof Miao) {
    args.shift();

    util.constant(this, 'miao', miao);
    this.Router = util.stick(Router, [ miao, this ]);
  }

  KoaApp.apply(this, args);

  this.poweredBy = false;
  this.registry = {};
};

inherits(App, KoaApp);

var appProto = App.prototype;

appProto.Controller = Controller;
appProto.Router = Router;

appProto.model = function (modelPath, mongooseIndex) {
  if (!this.miao) {
    return;
  }

  modelPath = path.join(
    this.miao.constant.path.APP_MODELS,
    modelPath
  );

  if (!mongooseIndex) {
    mongooseIndex = 0;
  }

  var mongooses = this.miao.ds.mongooses;

  assert(
    mongooseIndex < mongooses.length,
    'Mongoose instance index out of bound!'
  );

  var hash = 'model:' + mongooseIndex + ':' + modelPath;

  if (hash in this.registry) {
    return this.registry[hash];
  }

  this.registry[hash] = 'loading';

  var mongoose = mongooses[mongooseIndex];
  var load = require(modelPath);
  var model = load(mongoose, this.miao);

  return (this.registry[hash] = model);
};

appProto.controller = function (controllerPath) {
  if (!this.miao) {
    return;
  }

  controllerPath = path.join(
    this.miao.constant.path.APP_CONTROLLERS,
    controllerPath
  );

  var hash = 'controller:' + controllerPath;

  if (hash in this.registry) {
    return this.registry[hash];
  }

  var controller = new Controller();
  var setup = require(controllerPath);

  setup.call(controller, this.miao);

  return (this.registry[hash] = controller);
};

appProto.helper = function (helperPath) {
  if (!this.miao) {
    return;
  }

  helperPath = path.join(
    this.miao.constant.path.APP_HELPERS,
    helperPath
  );

  var hash = 'helper:' + helperPath;

  if (hash in this.registry) {
    return this.registry[hash];
  }

  var load = require(helperPath);
  var helper = load(this.miao);

  return (this.registry[hash] = helper);
};

appProto.route = function () {
  if (!this.miao || this.get) {
    return;
  }

  var router = new this.Router();
  this.use(router.middleware());

  util.invokeDirectory(
    this.miao.constant.path.ROUTES,
    this.miao
  );
};
