(function() {
  'use strict';

  global.appRequire = function(name) {
    return require(__dirname + '/' + name);
  };

  global.io = appRequire('configuration/module.config');

  var  catchAll  = require('./html_routes');

  /*Configuration File NoSQL Database*/
  require('./configuration/mongodb'); //mongodb integration

  /*Start our Express Server*/
  var app = io.express();

  /*Require our Configuration Files*/
  require('./configuration/express')(app);
  require('./configuration/passport')(io.passport);

  /*Routes*/
  //app.use(afterResponse);
  io.use_app(app, io);
  io.use_api(app, io);
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({
      message: err.message,
      status: err.status || 500
    });
  });
  app.use('*', catchAll);

  /*server test*/
  if (io.args.serverTest) {
    module.exports = app;
    return module.exports;
  }

    var http = require('http');
    var server = http.createServer(app);
    var socket_io = require('socket.io')(server);

    server.listen(io.port, function() {
      console.log(io.chalk.red.reset.underline('listening to port ') +
      io.chalk.cyan.bold((io.port)));
    });

    socket_io.on('connection', io.socket);

  function afterResponse(req, res, next) {
    var response = function(db) {
      io.mongoose.connection.close(function (db) {
        console.log('Mongoose connection disconnected upon close');
      });
    };
    var disconnectAsync = function() {
      io.mongoose.disconnectAsync(function() {
        console.log('Mongoose connection disconnected upon disconnect');
        response();
      });
    };
    res.on('finish', disconnectAsync);
    next();
  }
}());
