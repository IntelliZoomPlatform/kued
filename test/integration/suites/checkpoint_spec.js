'use strict';

const _ = require('lodash');
const async = require('async');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const TestUtils = require('../../utils');

const queue = require('./queue');

const Worker = require('../../../lib/worker');
const Logger = require('../../logger');
const logger = new Logger();



describe('Checkpoint', function(){


  it('should not process items if the predicate returns false.', function(next){

    this.timeout(3000);

    const handlerSpy = sinon.spy();
    const topic = `checkpoint-test-${new Date().getTime()}`

    class TestWorker extends Worker {

      init(){
        this.checkpoint()
          .topic(topic)
          .concurrency(5)
          .iff(this.predicate.bind(this))
          .keyFactory(this.keyFactory.bind(this))
          .process(this.handler.bind(this));
      }

      keyFactory(data){
        return data.i;
      }

      predicate(data, checkpointValue, done){
        done(null, data.i === checkpointValue);
      }

      handler(job, context, done){
        handlerSpy(job.data.i);
        done(null, job.data.i);
      }
    }

    const checkpointer = {
      getCheckpoint: sinon.stub(),
      updateCheckpoint: sinon.spy()
    };

    checkpointer.getCheckpoint.withArgs(0).callsArgWith(1, null, 0);
    checkpointer.getCheckpoint.withArgs(1).callsArgWith(1, null, -1);
    checkpointer.getCheckpoint.withArgs(2).callsArgWith(1, null, 2);
    checkpointer.getCheckpoint.withArgs(3).callsArgWith(1, null, -1);
    checkpointer.getCheckpoint.withArgs(4).callsArgWith(1, null, 4);

    const worker = new TestWorker({}, logger, checkpointer, queue);

    worker.init();

    async.series([
      (next) => queue.create(topic, { i: 0 }).save(next),
      (next) => queue.create(topic, { i: 1 }).save(next),
      (next) => queue.create(topic, { i: 2 }).save(next),
      (next) => queue.create(topic, { i: 3 }).save(next),
      (next) => queue.create(topic, { i: 4 }).save(next)
    ], function(err){
      setTimeout(TestUtils.wrapAsync(next, function(){

        expect(err).to.be.null;

        expect(handlerSpy).to.have.callCount(3);

      }), 100);
    });
  });


});