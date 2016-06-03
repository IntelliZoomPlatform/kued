'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = require('assert');
chai.use(sinonChai);

const Worker = require('../../../lib/worker');
const Logger = require('../../logger');
const logger = new Logger();

describe('Worker', function(){

  const createQueueStub = function(processStub){
    return {
      process: processStub || sinon.spy()
    };
  };

  describe('when registering processes', function(){

    it('should allow the registration of process handlers using function or method', function(){

      class TestWorker extends Worker {

        init(){
          this.process('test-topic', 42, this.handler.bind(this));
        }

        handler(job, context, done){ }
      }

      const queueStub = createQueueStub();

      const worker = new TestWorker({}, logger, sinon.spy(), queueStub);

      worker.init();

      expect(queueStub.process).to.be.calledWithMatch('test-topic', 42, sinon.match.func);

    });

    it('should allow the registration of process handlers by referencing a property on the worker', function(){

      class TestWorker extends Worker {

        init(){
          this.process('test-topic', 10, 'handler');
        }

        handler(job, context, done){}
      }

      const queueStub = createQueueStub();

      const worker = new TestWorker({}, logger, sinon.spy(), queueStub);

      worker.init();

      expect(queueStub.process).to.be.calledWithMatch('test-topic', 10, sinon.match.func);

    });

    it('should throw an error during registration of process handlers if the referenced property does not exist', function(){

      class TestWorker extends Worker {

        init(){
          this.process('test-topic', 1, 'notfound');
        }
      }

      const queueStub = createQueueStub();

      const worker = new TestWorker({}, logger, sinon.spy(), queueStub);

      expect(function(){

        worker.init();

      }).to.throw(assert.AssertionError);

    });

    it('should allow the omission of the concurrency property', function(){

      class TestWorker extends Worker {

        init(){
          this.process('test-topic', this.handler.bind(this));
        }

        handler(job, context, done){}
      }

      const queueStub = createQueueStub();

      const worker = new TestWorker({}, logger, sinon.spy(), queueStub);

      worker.init();

      expect(queueStub.process).to.be.calledWithMatch('test-topic', 1, sinon.match.func);

    });
  });

  describe('when executing a handler', function(){

    it('should catch uncaught exceptions occurring in the handler', function(){

      class TestWorker extends Worker {

        init(){
          this.process('test-topic', 1, this.handler.bind(this));
        }

        handler(job, context, done){
          throw new Error('Oops!');
        }
      }

      // IDK why, but stub.callWithArgs(2, {}, {}, spy) was not firing.
      // So I'm going to capture the callback and manually invoke it.
      let capturedCallback = null;
      const processStub = function(topic, concurrency, callback){
        capturedCallback = callback;
      };

      const queueStub = createQueueStub(processStub);

      const worker = new TestWorker({}, logger, sinon.spy(), queueStub);

      worker.init();

      const doneSpy = sinon.spy();

      capturedCallback({}, {}, doneSpy);

      expect(doneSpy).to.be.calledWithMatch(sinon.match.instanceOf(Error));
    });
  });
});