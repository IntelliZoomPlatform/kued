'use strict';

const Joi = require('joi');
const Boom = require('boom');
const ConfigSchema = require('../schemas/config');

const WorkgroupManager = require('../workgroup-manager');

module.exports.register = (server, config, next) => {

  const configCheck = Joi.validate(config, ConfigSchema);

  if (configCheck.error){
    server.log(['error'], { message: 'Invalid configuration.', error: configCheck.error });
    return next(new Error(configCheck.error));
  }

  const workgroupManager = new WorkgroupManager(server);

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

  const launch = (callback) => {
    return () => {
      workgroupManager.launch(config, (err) => {
        if (err) {
          server.log(['error'], { message: 'Failed to launch one or more Workgroups.', error: err });
          return callback(err);
        }
        callback();
      });
    };
  };

  workgroupManager.on('workers-spawned', (envelope) => {
    server.log(['info', envelope.process.name], { message: envelope.data.message });
  });

  workgroupManager.on('error', (envelope) => {
    server.log(['error', envelope.process.name], envelope.data);
  });

  server.route({
    method: 'GET',
    path: '/workgroups',
    handler: (request, reply) => {
      workgroupManager.getWorkgroups((err, workgroups) => {
        if (err) return reply(Boom.badImplementation(err));
        return reply(workgroups);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/workgroups',
    handler: (request, reply) => {
      launch((err) => {
        if (err) return reply(Boom.badImplementation(err));
        return reply({ success: true });
      })();
    }
  });

  server.route({
    method: 'POST',
    path: '/workgroups/rotate-logs',
    handler: (request, reply) => {
      workgroupManager.rotateLogs((err) => {
        if (err) return reply(Boom.badImplementation(err));
        return reply({ success: true });
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/workgroups/{processIdOrWorkgroupName}',
    config: {
      validate: {
        params: {
          processIdOrWorkgroupName: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string().min(3))
        }
      }
    },
    handler: (request, reply) => {
      workgroupManager.getWorkgroup(request.params.processIdOrWorkgroupName, (err, workgroup) => {
        if (err) return reply(Boom.badImplementation(err));
        return reply(workgroup);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/workgroups/{processIdOrWorkgroupName}/{action}',
    config: {
      validate: {
        params: {
          processIdOrWorkgroupName: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string().min(3)),
          action: Joi.string().valid('resume', 'stop', 'restart')
        }
      }
    },
    handler: (request, reply) => {
      workgroupManager[request.params.action](request.params.processIdOrWorkgroupName, (err) => {
        if (err) return reply(Boom.badImplementation(err));
        return reply({ success: true });
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/workgroups/{processIdOrWorkgroupName}',
    config: {
      validate: {
        params: {
          processIdOrWorkgroupName: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string().min(3))
        }
      }
    },
    handler: (request, reply) => {
      workgroupManager.kill(request.params.processIdOrWorkgroupName, (err) => {
        if (err) return reply(Boom.badImplementation(err));
        return reply({ success: true });
      });
    }
  });

  // Launch the workers and then notify the server to start.
  connect(launch(next));
};

module.exports.register.attributes = {
  name: 'kued',
  version: '1.0.0'
};