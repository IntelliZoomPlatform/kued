'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = require('assert');
chai.use(sinonChai);

const Checkpoint = require('../../../lib/checkpoint');
const Logger = require('../../logger');
const logger = new Logger();

describe('Checkpoint', function(){

  describe('when registering handlers', function(){

    it('should allow functions to be supplied', function(){

      const worker = {
        handler: sinon.spy(),
        process: sinon.spy()
      };

      const checkpoint = new Checkpoint(logger, worker, sinon.spy());

      checkpoint.topic('foo');
      checkpoint.keyFactory(_.noop);
      checkpoint.iff(_.noop);

      checkpoint.process(worker.handler);

      expect(worker.process).to.be.calledWithMatch('foo', 1, sinon.match.func);
    });

    it('should allow string references to methods on the worker', function(){

      const worker = {
        handler: sinon.spy(),
        process: sinon.spy()
      };

      const checkpoint = new Checkpoint(logger, worker, sinon.spy());

      checkpoint.topic('foo');
      checkpoint.keyFactory(_.noop);
      checkpoint.iff(_.noop);

      checkpoint.process('handler');

      expect(worker.process).to.be.calledWithMatch('foo', 1, sinon.match.func);
    });

    it('should throw an error if the handler is not valid', function(){

      const worker = {};
      const checkpoint = new Checkpoint(logger, worker, sinon.spy());

      checkpoint.topic('foo');
      checkpoint.keyFactory(_.noop);
      checkpoint.iff(_.noop);

      expect(function(){

        checkpoint.process(1234);

      }).to.throw(assert.AssertionError);

    });

    it('should throw an error if the predicate function is not supplied', function(){

      const worker = {
        handler: sinon.spy()
      };

      const checkpoint = new Checkpoint(logger, worker, sinon.spy());

      checkpoint.topic('foo');
      checkpoint.keyFactory(_.noop);

      expect(function(){

        checkpoint.process(worker.handler);

      }).to.throw(assert.AssertionError);
    });

    it('should throw an error if the key factory function is not supplied', function(){

      const worker = {
        handler: sinon.spy()
      };

      const checkpoint = new Checkpoint(logger, worker, sinon.spy());

      checkpoint.topic('foo');
      checkpoint.iff(_.noop);

      expect(function(){

        checkpoint.process(worker.handler);

      }).to.throw(assert.AssertionError);
    });

    it('should throw an error if the topic is not supplied', function(){

      const worker = {
        handler: sinon.spy()
      };

      const checkpoint = new Checkpoint(logger, worker, sinon.spy());

      checkpoint.keyFactory(_.noop);
      checkpoint.iff(_.noop);

      expect(function(){

        checkpoint.process(worker.handler);

      }).to.throw(assert.AssertionError);
    });
  });

  describe('when executing handlers', function(){

    it('should fail if there is no previous checkpoint value and failIfCheckpointAbsent is set', function(){

      let capturedHandler = null;
      const worker = {
        handler: sinon.stub(),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = { getCheckpoint: sinon.stub() };
      const done = sinon.spy();
      const predicate = sinon.spy();
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.failIfCheckpointAbsent();
      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      checkpointer.getCheckpoint.callArgWith(1, null, null);

      expect(done).to.be.calledWithMatch(sinon.match.instanceOf(Error));

      expect(predicate).to.not.be.called;
    });

    it('should NOT fail if there is no previous checkpoint value and failIfCheckpointAbsent is NOT set', function(){

      let capturedHandler = null;
      const worker = {
        handler: sinon.stub(),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = { getCheckpoint: sinon.stub() };
      const done = sinon.spy();
      const predicate = sinon.spy();
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      checkpointer.getCheckpoint.callArgWith(1, null, null);

      expect(predicate).to.be.called;
    });

    it('should fail if the Checkpointer errors and ignoreCheckpointFailure is NOT set', function(){

      let capturedHandler = null;
      const worker = {
        handler: sinon.stub(),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = { getCheckpoint: sinon.stub() };
      const done = sinon.spy();
      const predicate = sinon.spy();
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      const error = new Error('Whoa!');

      checkpointer.getCheckpoint.callArgWith(1, error);

      expect(done).to.be.calledWith(error);

      expect(predicate).to.not.be.called;
    });

    it('should NOT fail if the Checkpointer errors and ignoreCheckpointFailure is set', function(){

      let capturedHandler = null;
      const worker = {
        handler: sinon.stub(),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = { getCheckpoint: sinon.stub() };

      const done = sinon.spy();
      const predicate = sinon.spy();
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.ignoreCheckpointFailure();
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      const error = new Error('Whoa!');

      checkpointer.getCheckpoint.callArgWith(1, error);

      expect(done).to.not.be.calledWith(error);

      expect(predicate).to.be.called;
    });

    it('should fail if the predicate function returns an error', function(){

      let capturedHandler = null;
      const worker = {
        handler: sinon.stub(),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = { getCheckpoint: (key, done) => done(null, 'foo') };
      const done = sinon.spy();
      const error = new Error('Oh noz!');
      const predicate = (data, value, callback) => { callback(error); };
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      expect(done).to.be.calledWith(error);
    });
    
    it('should not invoke the handler if the predicate function returns false', function(){

      let capturedHandler = null;
      const worker = {
        handler: sinon.spy(),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = { getCheckpoint: (key, done) => done(null, 'foo') };
      const done = sinon.spy();
      const predicate = (data, value, callback) => { callback(null, false); };
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      expect(worker.handler).to.not.be.called;
      expect(done).to.be.called;
    });

    it('should invoke the handler if the predicate function returns true', function(){

      let capturedHandler = null;
      const worker = {
        handler: sinon.spy(),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = { getCheckpoint: (key, done) => done(null, 'foo') };
      const done = sinon.spy();
      const predicate = (data, value, callback) => { callback(null, true); };
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      expect(worker.handler).to.be.called;
    });

    it('should return an error if the handler returns an error', function(){

      let capturedHandler = null;
      const error = new Error('No way dude');
      const worker = {
        handler: (job, context, done) => done(error),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = {
        getCheckpoint: (key, done) => done(null, 'foo'),
        updateCheckpoint: sinon.spy()
      };
      const done = sinon.spy();
      const predicate = (data, value, callback) => { callback(null, true); };
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      expect(done).to.be.calledWith(error);
    });

    it('should update the new checkpoint value if it\'s returned by the handler', function(){

      let capturedHandler = null;
      const worker = {
        handler: (job, context, done) => done(null, 'bar'),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = {
        getCheckpoint: (key, done) => done(null, 'foo'),
        updateCheckpoint: sinon.stub()
      };
      const done = sinon.spy();
      const predicate = (data, value, callback) => { callback(null, true); };
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      checkpointer.updateCheckpoint.callArg(2);

      expect(checkpointer.updateCheckpoint).to.be.calledWithMatch('foo', 'bar', sinon.match.func);
      expect(done).to.be.called;
    });

    it('should return an error if the new checkpoint value cannot be updated', function(){

      let capturedHandler = null;
      const worker = {
        handler: (job, context, done) => done(null, 'bar'),
        process: function(topic, concurrency, handler){
          capturedHandler = handler;
        }
      };

      const checkpointer = {
        getCheckpoint: (key, done) => done(null, 'foo'),
        updateCheckpoint: sinon.stub()
      };
      const done = sinon.spy();
      const error = new Error('American technology, Russian technology...all made in Taiwan.');
      const predicate = (data, value, callback) => { callback(null, true); };
      const checkpoint = new Checkpoint(logger, worker, checkpointer);

      checkpoint.topic('foo');
      checkpoint.keyFactory(() => 'foo');
      checkpoint.iff(predicate);
      checkpoint.process(worker.handler);

      capturedHandler({}, {}, done);

      checkpointer.updateCheckpoint.callArgWith(2, error);
      
      expect(checkpointer.updateCheckpoint).to.be.calledWithMatch('foo', 'bar', sinon.match.func);
      expect(done).to.be.calledWith(error);
    });
  });

});