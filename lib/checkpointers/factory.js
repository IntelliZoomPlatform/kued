'use strict';

module.exports = (config, logger) => {
  const RedisCheckPointer = require('./redis');
  return new RedisCheckPointer(config, logger);
};