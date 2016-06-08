'use strict';

const Joi = require('joi');
const ConfigSchema = require('../schemas/config');

const WorkgroupManager = require('../workgroup-manager');

module.exports.register = (server, config, next) => {

  const configCheck = Joi.validate(config, ConfigSchema);

  if (configCheck.error){
    server.log(['error'], { message: 'Invalid configuration.', error: configCheck.error });
    return next(new Error(configCheck.error));
  }

  const workgroupManager = new WorkgroupManager(console);

  const connect = (callback) => {
    workgroupManager.connect((err) => {
      if (err) {
        server.log(['error'], { message: 'Could not communicate with the PM2 daemon.', error: err });
        setTimeout(() => { connect(callback); }, 60000);
        return;
      }
      if (callback) callback();
    });
  };

  connect(() => {
    workgroupManager.launch(config, (err) => {
      if (err) {
        server.log(['error'], { message: 'Failed to launch one or more Workgroups.', error: err });
        return next(err);
      }
    });
  });

  workgroupManager.on('error', (envelope) => {
    server.log(['error', envelope.process.name], envelope.data);
  });
};

module.exports.register.attributes = {
  name: 'kued',
  version: '1.0.0'
};