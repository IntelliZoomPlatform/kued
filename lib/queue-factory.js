'use strict';

const kue = require('kue');

class QueueFactory {

  constructor(config){
    this.config = conig;
    this.queue = null;
  }

  get Queue(){
    const config = this.config;
    if (!this.queue){
      const queue = kue.createQueue(config.kue.connection);
      // Watch stuck jobs if defined
      if (config.kue.watchStuckInterval){
        queue.watchStuckJobs(config.kue.watchStuckInterval);
      }
      this.queue = queue;
    }
    return this.queue;
  }
}

module.exports = QueueFactory;