'use strict';

const _ = require('lodash');
const IronMQClient = require('iron_mq').Client;

class IronMQOutput {

  constructor(config, imqConfig, logger, _queue){

    config.options = config.options || {};
    config.options.imq = config.options.imq || {};

    this.queueName = config.output.slice(config.output.indexOf(':') + 1);

    this.logger = logger;

    if (_queue){
      this.queue = _queue;
    }
    else {
      const imq = new IronMQClient(imqConfig);
      this.queue = imq.queue(this.queueName);
    }
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