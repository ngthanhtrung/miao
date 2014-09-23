'use strict';

module.exports = function (miao) {
  var app = miao.app;
  app.get('/hello', 'hello > user');
};
