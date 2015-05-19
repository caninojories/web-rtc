(function() {
  'use strict';

  module.exports = function(client, clients, socket, data) {
    client.search({
      index: 'webrtc',
      type: 'data',
      body: {
        query: {
          filtered: {
            // query:  { match: { interest: data.interest }},
            filter: { term: { match: 'false' }}
          }
        }
      }
    }).then(function(body) {
      /*make the match to true for both users*/
      var hits = body.hits.hits;
      if (hits.length === 0) {
        /*save the incoming socket id*/
        /* if this socket id is not present */
        client.create({
          index: 'webrtc',
          type: 'data',
          id: socket.id,
          body: {
            interest  : 'null',
            match     : 'false',
            room      : socket.id,
            match_id  : 'null'
          }
        });
        /*save this room name in the client(the issuer)*/
        clients[socket.id].emit('join_room', {room:socket.id, match: false});

        /*join room for chat*/
        socket.join(socket.id);
      } else {
        console.log('socket id is present');
        console.log('having a common interest');
        console.log('finding a match === false');
        /*make a post to change match === true*/
        client.update({
          index: 'webrtc',
          type: 'data',
          id : hits[0]._id.toString(),
          body: {
            doc: {
              match: 'true',
              match_id: socket.id
            }
          }
        });

        /*Save the second instance of the webRTC*/
        client.create({
          index: 'webrtc',
          type: 'data',
          id: socket.id,
          body: {
            interest  : 'null',
            match     : 'true',
            room      : hits[0]._source.room,
            match_id  : hits[0]._id
          }
        });
        /* connect to the id of the first hits*/
        clients[socket.id].emit('join_room', {room:hits[0]._source.room, match: true});

        clients[hits[0]._source.room].emit('room_token', hits[0]._source.room);
        clients[socket.id].emit('room_token', hits[0]._source.room);
        /*join room for chat*/
        socket.join(hits[0]._source.room);

        /*message both of them they are connected*/
        clients[socket.id].emit('connected_peer');
        clients[hits[0]._source.room].emit('connected_peer');
      }
    });
  };
}());
