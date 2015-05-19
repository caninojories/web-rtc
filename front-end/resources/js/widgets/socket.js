(function() {
  'use strict';

  angular
    .module('app.widgets')
    .factory('socket', socket);

    socket.$inject = ['$rootScope'];

    /*@ngInject*/
    function socket($rootScope) {
      var socket_ = io.connect();
      var service = {
        on: on,
        emit: emit
      };

      return service;

      function on(eventName, data, callback) {
        socket_.on(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket_, args);
          });
        });
      }

      function emit(eventName, value) {
        socket_.emit(eventName, value);
        // socket_.emit(eventName, function () {
        //   var args = arguments;
        //   $rootScope.$apply(function () {
        //     if (callback) {
        //       callback.apply(socket_, args);
        //     }
        //   });
        // });
      }
    }
}());
