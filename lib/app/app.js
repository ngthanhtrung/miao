'use strict';

var App = require('../overrides/koa').App;
var Controller = require('./controller').Controller;
var Router = require('../overrides/koa-router').Router;

exports = module.exports = function (miao) {
  return new App(miao);
};

exports.App = App;
exports.Controller = Controller;
exports.Router = Router;
