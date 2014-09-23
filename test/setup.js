'use strict';

var co = require('co');
var mocha;

try {
  mocha = require('mocha');
}
catch (_) {
  mocha = require('gulp-mocha/node_modules');
}

var Runnable = mocha.Runnable;

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var util = require('../lib/util');

var run = Runnable.prototype.run;

Runnable.prototype.run = function () {
  if (util.isGeneratorFunction(this.fn)) {
    this.fn = co(this.fn);
    this.async = true;
    this.sync = false;
  }

  return run.apply(this, arguments);
};

chai.use(sinonChai);

global.expect = chai.expect;
global.sinon = sinon;

global.requireLib = function (moduleShortPath) {
  return require(__dirname + '/../lib/' + moduleShortPath);
};
