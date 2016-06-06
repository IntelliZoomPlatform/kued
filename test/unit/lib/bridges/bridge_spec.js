'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = require('assert');
chai.use(sinonChai);

const TestUtils = require('../../../utils');

const Bridge = require('../../../../lib/bridges/bridge');
const Logger = require('../../../logger');
const logger = new Logger();

describe('Bridge', function(){

  it('should fail if the input or output interfaces are invalid', function(){

    expect(function(){

      const input = {};
      const output = { dispatch: sinon.spy() };

      const bridge = new Bridge(logger, input, output);

    }).to.throw(assert.AssertionError);

    expect(function(){

      const input = { onMessage: sinon.spy() };
      const output = { };

      const bridge = new Bridge(logger, input, output);

    }).to.throw(assert.AssertionError);
  });

  it('should register a message listener with the input interface', function(){

    const input = { onMessage: sinon.spy() };
    const output = { dispatch: sinon.spy() };
    new Bridge(logger, input, output);

    expect(input.onMessage).to.be.calledWithMatch(sinon.match.func);

  });

  it('should dispatch messages as they are received by the input interface to the output interface', function(next){

    const input = { onMessage: sinon.spy() };
    const output = { dispatch: sinon.stub() };
    const bridge = new Bridge(logger, input, output);
    const payload = { foo: 'bar' };

    bridge.handleIncomingMessage(payload, TestUtils.wrapAsync(next, function(){
      expect(output.dispatch).to.be.calledWithMatch(payload, sinon.match.func);
    }));

    output.dispatch.callArgOn(1, null);
  });

  it('should start the input and output interfaces on initialization', function(){

    const input = { onMessage: sinon.spy(), start: sinon.spy() };
    const output = { dispatch: sinon.spy(), start: sinon.spy() };
    const bridge = new Bridge(logger, input, output);

    bridge.init();

    expect(input.start).to.be.called;
    expect(output.start).to.be.called;
  });

  it('should start the input and output interfaces on request', function(){

    const input = { onMessage: sinon.spy(), start: sinon.spy() };
    const output = { dispatch: sinon.spy(), start: sinon.spy() };
    const bridge = new Bridge(logger, input, output);

    bridge.start();

    expect(input.start).to.be.called;
    expect(output.start).to.be.called;
  });

  it('should stop the input and output interfaces on request', function(){

    const input = { onMessage: sinon.spy(), stop: sinon.spy() };
    const output = { dispatch: sinon.spy(), stop: sinon.spy() };
    const bridge = new Bridge(logger, input, output);

    bridge.stop();

    expect(input.stop).to.be.called;
    expect(output.stop).to.be.called;
  });
});