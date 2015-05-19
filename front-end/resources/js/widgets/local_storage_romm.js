(function() {
  'use strict';

  angular
    .module('app.services')
    .factory('roomToken', roomToken);

    roomToken.$inject = ['$window'];

  /* @ngInject */
  function roomToken($window) {
    var storage = $window.localStorage;
    var cachedToken;
    var room_token = 'room_token';

    var room = {
      setToken: function(room_name) {
        cachedToken = room_name;
        storage.setItem(room_token, room_name);
      },
      getToken: function() {
        if (!cachedToken) {
          cachedToken = storage.getItem(room_token);
        }

        return cachedToken;
      },
      removeToken: function() {
        cachedToken = null;
        storage.removeItem(room_token);
      }
    };

    return room;
  }
}());
