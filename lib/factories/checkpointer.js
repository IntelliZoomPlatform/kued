'use strict';

const RedisCheckPointer = require('../checkpointers/redis');

class CheckpointerFactory {

  static options(){
    return {
      singleton: true,
      mode: 'factory'
    }
  }

  static create(config, logger){
    return new RedisCheckPointer(config, logger);
  }
}

module.exports = CheckpointerFactory;