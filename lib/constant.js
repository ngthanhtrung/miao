'use strict';

var path = require('path');
var clone = require('clone');

exports = module.exports = function (basePath) {
  basePath = basePath || process.cwd();

  var ret = clone(exports.base);
  var paths = ret.path;

  for (var key in paths) {
    paths[key] = path.join(
      basePath,
      paths[key]
    );
  }

  return ret;
};

exports.base = {
  path: {
    BASE: '.',

    CONFIG: 'config/app.yml',
    INITIALIZERS: 'config/initializers',
    ROUTES: 'config/routes',

    LOGS: 'logs',

    APP: 'app',

    APP_ASSETS: 'app/assets',
    APP_ASSETS_CSS: 'app/assets/stylesheet',
    APP_ASSETS_JS: 'app/assets/javascript',

    APP_MODELS: 'app/models',
    APP_VIEWS: 'app/views',
    APP_CONTROLLERS: 'app/controllers',
    APP_HELPERS: 'app/helpers',


    PUBLIC: 'public',
    PUBLIC_FAVICON: 'public/favicon.ico',
    PUBLIC_CSS: 'public/css',
    PUBLIC_JS: 'public/js',

    APP_CLIENT_CONFIG: 'app/assets/javascript/config',
    PUBLIC_CONFIG: 'public/js/config',

    APP_CLIENT_TEMPLATES: 'app/assets/javascript/app/templates',
    PUBLIC_TEMPLATES: 'public/js/app/templates'
  },

  view: {
    LAYOUTS_DIR: 'layouts',
    BASE_LAYOUT: 'base'
  }
};
