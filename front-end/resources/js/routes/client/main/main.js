(function() {
  'use strict';

  angular
    .module('app.main')
    .controller('Main', Main);

    Main.$inject = ['$location', '$rootScope', '$state', '$timeout', '$window', 'socket', 'roomToken'];

    /* @ngInject */
    function Main($location, $rootScope, $state, $timeout, $window, socket, roomToken) {
      var vm = this;

      vm.show_chat            = true;
      vm.disable_chat_window  = true;

      vm.find           = find;
      vm.stop           = stop;
      vm.send_message   = send_message;
      vm.user_location  = user_location;

      var message   = '<strong class="connecting">Connecting...</br></strong>';
      vm.chat_text  = 'Start Chatting...';

      roomToken.removeToken();

      var webrtc = new SimpleWebRTC({
        localVideoEl: 'localVideo',
        remoteVideosEl: '',
      });

      $rootScope.$on('tags', function(event, data) {
          vm.interest = data;
      });

      $rootScope.$on('message_send', function(event, data) {
        $timeout(function() {
          send_message();
        }, 0);
      });

      socket.on('connect', function() {
        console.log('connected');
      });

      socket.on('connected_peer', function() {
        console.log('stranger');
        $('.connecting').remove();
        $('.disconnected').remove();
        vm.disable_chat = false;
      });

      socket.on('disconnect', function() {
        roomToken.removeToken();
        console.log('disconnected');
      });

      socket.on('receive_message', function(message) {
        $rootScope.$broadcast('message', {message: message, user: 'Stranger'});
        console.log(message);
      });

      socket.on('room_token', function(data) {
        roomToken.setToken(data);
      });

      socket.on('videoRemoved', function() {
        console.log('video is removed socket');
        roomToken.removeToken();
        vm.disable_chat = true;
      });

      socket.on('join_room', function(data) {
        /*sent the data*/
        webrtc.startLocalVideo();
        webrtc.on('readyToCall', function () {
          webrtc.joinRoom(data.room);
          if (data.match === false) {
            $('.textarea').append(message);
          }
        });
      });


      function find() {
        console.log(vm.range);
        if ((vm.lat === undefined && vm.lon === undefined) && vm.range !== undefined) {
          return;
        }

        if ((vm.lat !== undefined && vm.lon !== undefined) && vm.range === undefined) {
          return;
        }

        vm.show_chat = false;
        $timeout(function() {
          socket.emit('find', {interest: vm.interest, lat: vm.lat, lon: vm.lon, range: vm.range});
        }, 2);
      }

      function stop() {
        $window.location.href = '/';
        vm.show_chat = true;
      }

      webrtc.on('videoAdded', function (video, peer) {
        vm.disable_chat = false;
        $('.connecting').remove();
        $('.disconnected').remove();
        message = '<strong class="connected">Stranger is now connected...</br></strong>';
        $('.textarea').append(message);
        var remotes = document.getElementById('remotes');
        if (remotes) {
            remotes.appendChild(video);
            $(video).addClass('img img-responsive');
            //socket.emit
        }
      });

      webrtc.on('videoRemoved', function (video, peer) {
        $('.connected').remove();
        message = '<strong class="disconnected">Stranger is disconnected...</br></strong>';
        $('.textarea').append(message);
        var remotes = document.getElementById('remotes');
        var $remotes  = $('#remotes');
        // webrtc.leaveRoom();
        vm.counterVideoAdded = 1;
        if ($remotes) {
            $remotes.children().remove();
            /*emit changes to the other end*/
            /*so that stop chatting will be start chatting*/
            socket.emit('videoRemoved', roomToken.getToken());
        }
      });

      function user_location() {
        vm.disable_chat = true;
        vm.chat_text    = 'Locating Your Position...';
        navigator.geolocation.getCurrentPosition(success, error);
      }

      function success(position) {
        console.log(position);
        $timeout(function() {
          vm.disable_chat = false;
        }, 0);
        vm.chat_text    = 'Start Chatting...';
        vm.lat          = position.coords.latitude;
        vm.lon          = position.coords.longitude;
      }

      function error() {
        console.log('error');
      }

      function send_message() {
        $rootScope.$broadcast('message', {message: vm.message, user: 'You'});
        socket.emit('send_message', {message: vm.message, room: roomToken.getToken()});
        vm.message = '';
      }

    }
}());
