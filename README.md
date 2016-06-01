# kued
Extensions for Kue (Daemonization, Checkpointing, etc.)

## Workers

Kued simplifies worker creation by organizing Job handling around classes:

```javascript
const Worker = require('kued').Worker;

class MyWorker extends Worker {

  // This is where you can register handlers.
  init(){
    this.process('my-task', 'myTaskHandler');
    this.process('my-task-2', this.myTask2Handler.bind(this));
    // Retrieve up to 50 messages at a time (default is 1).
    this.process('my-task-3', 50, this.myTask3Handler.bind(this));
    this.process('my-task-4', (job, context, done) -> done());
  }

  myTaskHandler(job, context, done){
    done();
  }

  myTask2Handler(job, context, done){
    done();
  }

  myTask3Handler(job, context, done){
    done();
  }
}
```

The queue is available to `Worker`s, so the outcome of one job can be another:

```javascript
const Worker = require('kued').Worker;

class MyWorker extends Worker {

  // This is where you can register handlers.
  init(){
    this.process('my-task', 'myTaskHandler');
  }

  myTaskHandler(job, context, done){
    this.queue.create('new-task', { foo: 'bar' }).save(done);
  }
}
```

Sometimes you just need tasks executed at a regular interval.  For this usecase, we have a special `CronWorker`:


```javascript
const CronWorker = require('kued').CronWorker;

class Synchronizer extends CronWorker {

  constructor(config, logger, _queue){
    const cron = { "cronTime": "10 * * * * *", "runOnInit": true };
    super(cron, config, logger, _queue);
  }

  tick(){
    this.queue.create('new-task', { foo: 'bar' }).save(done);
  }
}
```

## Daemonizing

```
node workers.js --config=workers.json
```

## Task Enqueuing from Cli

```
node tasks.js --config=tasks.json taskname --params
```