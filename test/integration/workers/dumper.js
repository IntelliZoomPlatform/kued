'use strict';

const Worker = require('../../../lib/worker');

class DumperWorker extends Worker {

  init(){
    this.process('dumper', (job, context, done) => {
      this.logger.log(['info'], { message: 'Got message from the ether', data: job.data });
      done();
    });
  }

}

module.exports = DumperWorker;