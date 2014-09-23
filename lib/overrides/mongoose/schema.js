'use strict';

var inherits = require('util').inherits;

var mongoose = require('mongoose');
var Miao = require('../../miao').Miao;
var util = require('../../util');

var slice = [].slice;

var Schema = exports.Schema = function (miao, index) {
  var args = slice.call(arguments);

  if (miao instanceof Miao) {
    args = args.splice(2);

    util.constant(this, 'miao', miao);
    util.constant(this, 'id', index);
  }

  args[1] = args[1] || {};
  args[1].id = false;

  mongoose.Schema.apply(this, args);

  this.set('toObject', { getters: true, virtuals: true });
  this.set('toJSON', { getters: true, virtuals: true });
};

inherits(Schema, mongoose.Schema);

for (var key in mongoose.Schema) {
  if (mongoose.Schema.hasOwnProperty(key)) {
    Schema[key] = mongoose.Schema[key];
  }
}

var schemaProto = Schema.prototype;
var schemaSuperProto = mongoose.Schema.prototype;

schemaProto.defaultOptions = function () {
  var options = schemaSuperProto.defaultOptions.apply(this, arguments);

  if (this.miao) {
    if ('autoIndex' in this.miao.options) {
      options.autoIndex = !!this.miao.options.autoIndex;
    }
    else {
      options.autoIndex = !this.miao.production;
    }
  }

  return options;
};
