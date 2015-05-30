(function() {
  'use strict';

  module.exports = function (dbName) {
    if( global.io.mongoose.connection.readyState === 0 ) {
      return global.io.mongoose.connectAsync(dbName);
    } else {
      io.io.mongoose.disconnectAsync();
      return global.io.mongoose.connectAsync(dbName);
    }
  };
}());
