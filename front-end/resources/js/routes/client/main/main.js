(function() {
  'use strict';

  angular
    .module('app.main')
    .controller('Main', Main);

    Main.$inject = ['$location', '$rootScope', '$state', '$timeout', '$window', 'roomToken'];

    /* @ngInject */
    function Main($location, $rootScope, $state, $timeout, $window, roomToken) {
      var vm = this;

      vm.show_chat            = true;
      vm.disable_chat_window  = true;

      vm.find           = find;
      vm.stop           = stop;
      vm.send_message   = send_message;
      vm.user_location  = user_location;

      var message;
      vm.chat_text  = 'Start Chatting...';
      var socket = io.connect('http://128.199.154.56:3005', { forceNew: true });

      roomToken.removeToken();

      var webrtc = new SimpleWebRTC({
        localVideoEl: 'localVideo',
        remoteVideosEl: 'remotes',
        url : 'http://128.199.154.56:8888'
      });

      $rootScope.$on('tags', function(event, data) {
          vm.interest = data;
      });

      $rootScope.$on('message_send', function(event, data) {
        $timeout(function() {
          send_message();
        }, 0);
      });

      socket.on('connected_peer', function() {
        $('.connecting').remove();
        $('.disconnected').remove();

        /*make the text connected to a stranger*/
        $('.connecting').remove();
        // $('.disconnected').remove();
        message = '<strong class="connected">Stranger is now connected...</br></strong>';
        $('.textarea').append(message);

        $timeout(function() {
          vm.disable_chat_window = false;
        }, 0)
      });

      socket.on('receive_message', function(message) {
        $rootScope.$broadcast('message', {message: message, user: 'Stranger'});
      });

      socket.on('room_token', function(data) {
        roomToken.setToken(data);
      });

      socket.on('stop', function() {
        /*disconnect the other user*/
        socket.disconnect();
        /*give B the information that A is disconnected*/
        $('.connecting').remove();
        $('.connected').remove();
        var message = '<strong class="disconnected">Stranger is disconnected...</br></strong>';
        $('.textarea').append(message);

        /*stop and remove video element from A*/
        webrtc.stopLocalVideo();
        webrtc.leaveRoom();
        var $remotes  = $('#localVideo');
        $remotes.children().remove();
        /*disconnect the B*/
        socket.disconnect();

        /*show our chat*/
        vm.show_chat = true;
        $timeout(function() {
          vm.chat_text    = 'Start Chatting...';
        }, 0);

        /*disable the chat of B*/
        vm.disable_chat_window = true;
      });

      socket.on('join_room', function(data) {
        console.log(webrtc);
        webrtc.on('readyToCall', function () {
          webrtc.joinRoom(data.room);
        });
      });


      function find() {
        socket.connect();

        if ((vm.lat === undefined && vm.lon === undefined) && vm.range !== undefined) {
          return;
        }

        if ((vm.lat !== undefined && vm.lon !== undefined) && vm.range === undefined) {
          return;
        }

        vm.show_chat = false;
        if (vm.interest === '') {
          vm.interest = undefined;
        }

        $timeout(function() {
          webrtc.startLocalVideo();
          socket.emit('find', {interest: vm.interest, lat: vm.lat, lon: vm.lon, range: vm.range});
        }, 0);

        /*change the information for chat as connecting*/
        $('.connected').remove();
        $('.disconnected').remove();
        var message   = '<strong class="connecting">Connecting...</br></strong>';
        $('.textarea').append(message);
      }

      function stop() {
        /*make the connected peer to disconnect*/
        socket.emit('stop', {room: roomToken.getToken()});
        /*then disconnect the user who stop the connection*/
        socket.disconnect();
        /*stop and remove video element from A*/
        webrtc.stopLocalVideo();
        webrtc.leaveRoom();
        var $remotes  = $('#localVideo');
        $remotes.children().remove();
        /*change the information for chat as connecting*/
        $('.connecting').remove();
        var message   = '<strong class="disconnected">Disconnected</br></strong>';
        $('.textarea').append(message);
        /*show our chat*/
        vm.show_chat = true;
        $timeout(function() {
          vm.chat_text    = 'Start Chatting...';
        }, 0);
        /*disable the chat of B*/
        vm.disable_chat_window = true;
      }

      webrtc.on('videoAdded', function (video, peer) {
        vm.disable_chat = false;
        if (peer && peer.pc) {
          peer.pc.on('iceConnectionStateChange', function (event) {
            switch (peer.pc.iceConnectionState) {
              case 'checking':
                console.log('checking');
                //connstate.innerText = 'Connecting to peer...';
                break;
              case 'connected':
              case 'completed': // on caller side
                console.log('completed');
                var remotes = document.getElementById('remotes');
                remotes.appendChild(video);
                //connstate.innerText = 'Connection established.';
                break;
              case 'disconnected':
                console.log('disconnected');
                //connstate.innerText = 'Disconnected.';
                break;
              case 'failed':
                break;
              case 'closed':
                console.log('closed');
                //connstate.innerText = 'Connection closed.';
                break;
            }
          });
        }
      });

      webrtc.on('videoRemoved', function (video, peer) {
        var remotes = document.getElementById('remotes');
        var $remotes  = $('#remotes');
        vm.counterVideoAdded = 1;
        if ($remotes) {
            $remotes.children().remove();
        }
      });

            // local p2p/ice failure
      webrtc.on('iceFailed', function (peer) {
        var pc = peer.pc;
        console.log('had local relay candidate', pc.hadLocalRelayCandidate);
        console.log('had remote relay candidate', pc.hadRemoteRelayCandidate);
      });

      // remote p2p/ice failure
      webrtc.on('connectivityError', function (peer) {
        var pc = peer.pc;
        console.log('had local relay candidate', pc.hadLocalRelayCandidate);
        console.log('had remote relay candidate', pc.hadRemoteRelayCandidate);
      });

      function user_location() {
        vm.disable_chat = true;
        vm.chat_text    = 'Locating Your Position...';
        navigator.geolocation.getCurrentPosition(success, error);
      }

      function success(position) {
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
