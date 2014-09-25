'use strict';

var clone = require('clone');
var extend = require('extend');

var redis = require('redis');
var coRedis = require('co-redis');

var elasticsearch = require('elasticsearch');

var Mongoose = require('./overrides/mongoose/mongoose').Mongoose;

var util = require('./util');
var defaultConfig = require('./config/config').default;

var isArray = Array.isArray;

exports = module.exports = function *(miao) {
  var ds = {};
  var config = miao.config;

  if (!isArray(config.mongo)) {
    config.mongo = [ config.mongo ];
  }

  var defaultMongoConfig = defaultConfig.mongo;
  var mongoConfigs = config.mongo;

  mongoConfigs.forEach(function (mongoConfig) {
    extend(
      true,
      mongoConfig,
      defaultMongoConfig,
      clone(mongoConfig)
    );
  });

  ds.Mongoose = util.stick(Mongoose, miao, 'Schema');

  ds.mongoose = new ds.Mongoose(0);
  var mongooses = ds.mongooses = [ ds.mongoose ];

  var connectToMongo = function (mongoose, mongoConfig) {
    return function (cb) {
      mongoose.connect(
        mongoConfig.host,
        mongoConfig.db,
        mongoConfig.port,
        mongoConfig.options,
        cb
      );
    };
  };

  yield mongoConfigs.map(function (mongoConfig, index) {
    var mongoose;

    if (mongooses.length > index) {
      mongoose = mongooses[index];
    }
    else {
      mongoose = new ds.Mongoose(index);
      mongooses.push(mongoose);
    }

    return connectToMongo(mongoose, mongoConfig);
  });

  var redisConfig = config.redis;
  var redisClient = redis.createClient(
    redisConfig.port,
    redisConfig.host
  );

  ds.redis = coRedis(redisClient);
  ds.redis.original = redisClient;

  var elasticConfig = config.elastic;

  ds.elastic = new elasticsearch.Client({
    host: 'http://' + elasticConfig.host + ':' + elasticConfig.port
  });

  return ds;
};

exports.Mongoose = Mongoose;
