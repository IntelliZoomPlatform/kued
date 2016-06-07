'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = require('assert');
chai.use(sinonChai);

const TestUtils = require('../../utils');

const queue = require('./queue');

const Worker = require('../../../lib/worker');
const Logger = require('../../logger');
const logger = new Logger();



describe('Worker', function(){

  it('should process an item from the queue.', function(next){

    const topic = `worker-test-${new Date().getTime()}`;

    let payload = null;

    class TestWorker extends Worker {

      init(){
        this.process(topic, function(job, context, done){
          payload = job.data;
          done();
        });
      }

    }

    const worker = new TestWorker({}, logger, queue);

    worker.init();

    queue.create(topic, { foo: 'bar' }).save(function(err){

      setTimeout(TestUtils.wrapAsync(next, function(){

        expect(err).to.be.null;
        expect(payload).to.deep.eq({ foo: 'bar' });

      }), 100);
    });
  });


});