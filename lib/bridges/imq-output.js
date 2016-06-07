'use strict';

const _ = require('lodash');

class IronMQOutput {

  constructor(config, logger, imq){

    config.options = config.options || {};
    config.options.imq = config.options.imq || {};

    this.queueName = config.output.slice(config.output.indexOf(':') + 1);

    this.logger = logger;

    this.queue = imq.queue(this.queueName);
  }

  dispatch(message, done){
    const body = (_.isString(message))? message : JSON.stringify(message);
    this.queue.post({ body }, (err) => {
      if (err){
        this.logger.log(['error'], { message: `Error forwarding message to queue "${this.queueName}"`, error: err });
        return done(err);
      }
      this.logger.log(['debug'], { message: `Forwarded message to queue "${this.queueName}"` });
      done();
    });
  }
}

module.exports = IronMQOutput;