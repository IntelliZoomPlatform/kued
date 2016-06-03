'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = require('assert');
chai.use(sinonChai);

const TestUtils = require('../utils');

const QueueFactory = require('../../lib/queue-factory');
const Worker = require('../../lib/worker');
const Logger = require('../logger');
const logger = new Logger();



describe('Worker', function(){

  const config = {
    kue: {
      connection: {
        prefix: 'worker_test',
        redis: {
          port: 6379,
          host: 'localhost'
        }
      }
    }
  };

  it('should process an item from the queue.', function(next){

    let payload = null;

    class TestWorker extends Worker {

      init(){
        this.process('test1', function(job, context, done){
          payload = job.data;
          done();
        });
      }

    }

    const queue = QueueFactory.create(config.kue);
    const worker = new TestWorker(config, logger, null, queue);

    worker.init();

    queue.create('test1', { foo: 'bar' }).save(function(err){

      setTimeout(TestUtils.wrapAsync(next, function(){

        expect(err).to.be.null;
        expect(payload).to.deep.eq({ foo: 'bar' });

        queue.shutdown(100);

      }), 100);
    });
  });


});