'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const IronMQOutput = require('../../../../lib/bridges/imq-output');
const Logger = require('../../../logger');
const logger = new Logger();

describe('IronMQ Bridge Output', function() {

  it('should parse the input string to obtain the queue name', function(){

    const config = {
      output: 'imq:test-queue'
    };

    const imq = {
      queue: sinon.stub()
    };

    const queue = {};

    imq.queue.returns(queue);

    const output = new IronMQOutput(config, logger, imq);

    expect(output.queueName).to.eq('test-queue');
  });

  it('should forward messages to IronMQ when a dispatch is requested', function() {

    const config = {
      output: 'imq:test-queue'
    };

    const imq = {
      queue: sinon.stub()
    };

    const queue = {
      post: sinon.stub()
    };

    imq.queue.returns(queue);

    const output = new IronMQOutput(config, logger, imq);

    const message = { foo: "bar" };

    const callback = sinon.spy();

    output.dispatch(message, callback);

    queue.post.callArgWith(1, null);

    expect(callback).to.be.called;
    expect(queue.post).to.be.calledWithMatch({ body: JSON.stringify(message) }, sinon.match.func);
  });
});