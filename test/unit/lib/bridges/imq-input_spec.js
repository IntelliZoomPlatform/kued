'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = require('assert');

chai.use(sinonChai);

const IronMQInput = require('../../../../lib/bridges/imq-input');
const Logger = require('../../../logger');
const logger = new Logger();

describe('IronMQ Bridge Input', function() {

  it('should parse the input string to obtain the queue name', function(){

    const config = {
      input: 'imq:test-queue'
    };

    const imq = {
      queue: sinon.stub()
    };

    const queue = {};

    imq.queue.returns(queue);

    const input = new IronMQInput(config, logger, imq);

    expect(input.queueName).to.eq('test-queue');
    expect(imq.queue).to.be.calledWith('test-queue');
  });

  it('should dispatch messages to the onMessage handler', function () {

    const config = {
      input: 'imq:test-queue'
    };

    const imq = {
      queue: sinon.stub()
    };

    const queue = {
      reserve: sinon.stub(),
      del_multiple: sinon.stub()
    };

    imq.queue.returns(queue);

    const input = new IronMQInput(config, logger, imq);

    const dispatch = sinon.stub();

    input.onMessage(dispatch);

    const messages = [{
      id: 1,
      reservation_id: 'asdfasdf',
      body: { foo: 'bar' }
    }];

    input.tick();

    queue.reserve.callArgWith(1, null, messages);
    dispatch.callArgWith(1, null);
    queue.del_multiple.callArgWith(1, null);

    expect(dispatch).to.be.calledWith(messages[0]);
    expect(queue.del_multiple).to.be.calledWith({ reservation_ids: messages });
  });

  it('should only acknowledge successfully dispatched messages', function(){

    const config = {
      input: 'imq:test-queue'
    };

    const imq = {
      queue: sinon.stub()
    };

    const queue = {
      reserve: sinon.stub(),
      del_multiple: sinon.stub()
    };

    imq.queue.returns(queue);
    const input = new IronMQInput(config, logger, imq);

    const dispatch = sinon.stub();

    input.onMessage(dispatch);

    const messages = [{
        id: 1,
        reservation_id: 'asdfasdf',
        body: { foo: 'bar' }
      }, {
        id: 2,
        reservation_id: 'dqerqweq',
        body: { foo: 'baz' }
    }];

    input.tick();

    queue.reserve.callArgWith(1, null, messages);

    dispatch.withArgs(messages[0]).callArgWith(1, null);
    dispatch.withArgs(messages[1]).callArgWith(1, new Error('Oh no!'));

    queue.del_multiple.callArgWith(1, null);

    expect(dispatch).to.be.calledWith(messages[0]);
    expect(queue.del_multiple).to.be.calledWith({ reservation_ids: [ messages[0] ] });

  });
});