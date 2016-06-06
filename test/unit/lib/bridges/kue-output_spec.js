'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const KueOutput = require('../../../../lib/bridges/kue-output');
const Logger = require('../../../logger');
const logger = new Logger();

describe('Kue Bridge Output', function() {

  it('should parse the input string to obtain the topic name', function(){

    const config = {
      output: 'kue:test-queue'
    };

    const queue = {};
    const output = new KueOutput(config, sinon.spy(), logger);

    expect(output.topicName).to.eq('test-queue');
  });

  it('should forward messages to Kue when a dispatch is requested', function() {

    const config = {
      output: 'kue:test-queue'
    };

    const queue = {
      create: sinon.stub()
    };

    const job = {
      priority: sinon.stub(),
      attempts: sinon.stub(),
      ttl: sinon.stub(),
      delay: sinon.stub(),
      save: sinon.stub()
    };

    queue.create.returns(job);
    job.priority.returns(job);
    job.attempts.returns(job);
    job.ttl.returns(job);
    job.delay.returns(job);

    const output = new KueOutput(config, queue, logger);

    const message = { foo: "bar" };

    const callback = sinon.spy();

    output.dispatch(message, callback);

    job.save.callArgWith(0, null);

    expect(callback).to.be.called;
    expect(queue.create).to.be.calledWith('test-queue', message);
    expect(job.priority).to.be.calledWith(0);
    expect(job.attempts).to.be.calledWith(1);
    expect(job.ttl).to.not.be.called;
    expect(job.delay).to.not.be.called;
    expect(job.save).to.be.calledWithMatch(sinon.match.func);
  });

  it('should allow default delivery options to be specified in the configuration', function(){

    const config = {
      output: 'kue:test-queue',
      options: {
        kue: {
          priority: 100,
          attempts: 5,
          backoff: {type:'exponential'},
          ttl: 10 * 1000,
          delay: 20 * 1000
        }
      }
    };

    const queue = {
      create: sinon.stub()
    };

    const job = {
      priority: sinon.stub(),
      attempts: sinon.stub(),
      ttl: sinon.stub(),
      delay: sinon.stub(),
      save: sinon.stub()
    };

    queue.create.returns(job);
    job.priority.returns(job);
    job.attempts.returns(job);
    job.ttl.returns(job);
    job.delay.returns(job);

    const output = new KueOutput(config, queue, logger);

    const message = { foo: "bar" };

    const callback = sinon.spy();

    output.dispatch(message, callback);

    job.save.callArgWith(0, null);

    expect(callback).to.be.called;
    expect(queue.create).to.be.calledWith('test-queue', message);
    expect(job.priority).to.be.calledWith(config.options.kue.priority);
    expect(job.attempts).to.be.calledWith(config.options.kue.attempts);
    expect(job.ttl).to.be.calledWith(config.options.kue.ttl);
    expect(job.delay).to.be.calledWith(config.options.kue.delay);
    expect(job.save).to.be.calledWithMatch(sinon.match.func);
  });
});