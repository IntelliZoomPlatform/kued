'use strict';

class KueInput {

  constructor(config, logger, queue){

    config.options = config.options || {};
    config.options.kue = config.options.kue || {};

    this.concurrency = config.options.kue.concurrency || 1;
    this.topicName = config.input.slice(config.input.indexOf(':') + 1);
    this.logger = logger;
    this.queue = queue;

    this.queue.process(this.topicName, this.concurrency, this.receiveMessage.bind(this));
  }

  onMessage(handler){
    this.dispatch = handler;
  }
  
  receiveMessage(job, context, done){
    if (this.dispatch === null){
      throw new Error('No message handler was set.  Who am I supposed to provide this message to?');
    }

    this.dispatch(job.data, (err) => {
      if (err){
        this.logger.log(['error'], { message: 'Error occurred dispatching message to handler.', error: err });
        return done(err);
      }
      this.logger.log(['debug'], { message: 'Dispatched message to handler.' });
      done();
    });
  }
}

module.exports = KueInput;