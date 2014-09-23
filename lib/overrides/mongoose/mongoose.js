'use strict';

var inherits = require('util').inherits;
var mongoose = require('mongoose');

var Miao = require('../../miao').Miao;
var util = require('../../util');
var Schema = require('./schema').Schema;

var slice = [].slice;

var Mongoose = exports.Mongoose = function (miao, index) {
  var args = slice.call(arguments);

  if (miao instanceof Miao) {
    args = args.splice(2);

    util.constant(this, 'miao', miao);
    util.constant(this, 'index', index);

    this.Schema = util.stick(Schema, [
      miao,
      index
    ]);
  }

  mongoose.Mongoose.apply(this, args);
};

inherits(Mongoose, mongoose.Mongoose);

Mongoose.prototype.Schema = Schema;
