'use strict';

const CronWorker = require('../../../lib/cronworker');

class HelloWorker extends CronWorker {

  tick(){
    this.logger.log(['info'], 'Hello!');
  }

}

module.exports = HelloWorker;