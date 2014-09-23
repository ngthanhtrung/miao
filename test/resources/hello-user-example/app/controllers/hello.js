'use strict';

module.exports = function (miao) {
  var app = miao.app;
  var User = app.model('user');

  this.action('user', function *() {
    this.body = 'Hello ' + User;
  });
};
