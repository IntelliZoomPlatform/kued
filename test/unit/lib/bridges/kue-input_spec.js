'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const KueInput = require('../../../../lib/bridges/kue-input');
const Logger = require('../../../logger');
const logger = new Logger();

describe('Kue Bridge Input', function() {

  it('should parse the input string to obtain the topic name', function(){

    const config = {
      input: 'kue:test-queue'
    };

    const queue = {
      process: sinon.spy()
    };

    const input = new KueInput(config, logger, queue);

    expect(input.topicName).to.eq('test-queue');
  });

  it('should dispatch messages to the onMessage handler', function () {

    const config = {
      input: 'kue:test-queue'
    };

    const queue = {
      process: sinon.spy()
    };

    const input = new KueInput(config, logger, queue);

    const dispatch = sinon.stub();

    input.onMessage(dispatch);

    const message = { foo: 'bar' };
    const callbackSpy = sinon.spy();

    input.receiveMessage({ data: message }, {}, callbackSpy);

    dispatch.callArgWith(1, null);

    expect(dispatch).to.be.calledWithMatch(message, sinon.match.func);
    expect(callbackSpy).to.be.called;
  });
});