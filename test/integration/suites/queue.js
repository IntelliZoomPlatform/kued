'use strict';

const KueFactory = require('../../../lib/factories/kue');

const config = {
  kue: {
    connection: {
      prefix: 'checkpoint_test',
      redis: {
        port: 6379,
        host: 'localhost'
      }
    }
  }
};

module.exports = KueFactory.create(config.kue);