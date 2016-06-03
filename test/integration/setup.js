
const queue = require('./suites/queue');

after(function(next){

  this.timeout(3000);

  queue.shutdown(1000, function(err){
    if (err) {
      console.error(err);
      return next(err);
    }
    next();
  });
});