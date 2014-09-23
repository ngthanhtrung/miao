'use strict';

var assert = require('assert');
var compose = require('koa-compose');

var util = require('../util');

var slice = [].slice;

var Controller = exports.Controller = function () {
  this.beforeFilters = [];
  this.afterFilters = [];
  this.actions = {};
};

var controllerProto = Controller.prototype;

[ 'before', 'after' ].forEach(function (position) {
  // Multi-dispatcher
  controllerProto[position] = function (condition) {
    var dispatchers = slice.call(arguments, 1);

    addFilter(
      this[position + 'Filters'],
      condition,
      dispatchers
    );
  };
});

controllerProto.action = function (name) {
  var dispatchers = slice.call(arguments, 1);

  assert(
    util.isString(name),
    'Action name must be string!'
  );

  assert(
    allGeneratorFunction(dispatchers),
    'Action dispatcher must be generator function!'
  );

  var actions = this.actions[name] || [];

  this.actions[name] = actions.concat(dispatchers);
};

controllerProto.handle = function (actionName) {
  var dispatchers = getDispatchers(
    this.beforeFilters,
    actionName
  );

  dispatchers = dispatchers.concat(
    this.actions[actionName] || []
  );

  var finalizers = getDispatchers(
    this.afterFilters,
    actionName
  );

  var dispatch = compose(dispatchers);

  return function *(next) {
    var bypassed = false;

    this.bypass = function *() {
      bypassed = true;
      yield next;
    };

    yield dispatch.call(this);

    if (finalizers.length && !bypassed) {
      yield finalizers;
    }
  };
};

function addFilter(filters, condition, dispatchers) {
  assert(
    allGeneratorFunction(dispatchers),
    'Filter dispatcher must be generator function!'
  );

  var regex = toRegex(condition);

  dispatchers.forEach(function (dispatcher) {
    filters.push({
      regex: regex,
      dispatcher: dispatcher
    });
  });
}

function getDispatchers(filters, actionName) {
  return filters
    .filter(function (filter) {
      return filter.regex.test(actionName);
    })
    .map(function (filter) {
      return filter.dispatcher;
    });
}

function toRegex(condition) {
  if (util.isString(condition)) {
    if (condition === '*') {
      return /.*/;
    }
    return new RegExp('^' + condition + '$');
  }

  if (Array.isArray(condition)) {
    return new RegExp('^(' + condition.join('|') + ')$');
  }

  assert(
    condition instanceof RegExp,
    'Invalid filter condition!'
  );

  return condition;
}

function allGeneratorFunction(values) {
  return values.every(function (value) {
    return util.isGeneratorFunction(value);
  });
}
