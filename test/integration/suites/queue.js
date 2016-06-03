'use strict';

const QueueFactory = require('../../../lib/queue-factory');

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

module.exports = QueueFactory.create(config.kue);