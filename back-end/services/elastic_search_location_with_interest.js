(function() {
  'use strict';

  module.exports = function(client, clients, socket, data) {
    console.log(data);
    client.search({
      index: 'webrtc',
      type: 'data',
      body: {
        query: {
          filtered: {
            //query:  { match: { interest: data.interest}},
            query: {
              bool: {
                should: [
                  { match: { interest:  data.interest }},
                  { match: { match : 'false'  }}
                ]
              }
            },
            filter: {
              bool: {
                must: [
                  { term: {match: 'false' }},
                  { term: {interest: data.interest }},
                {
                  geo_distance: {
                   distance: data.range.toString() + 'km',
                   distance_type: 'sloppy_arc',
                   location: {
                     lat:  data.lat.toString(),
                     lon: data.lon.toString()
                   }
                 }
                }],
              }
            }
          }
        }
      }
    }).then(function(body) {
      var hits = body.hits.hits;
      if (hits.length === 0) {
        console.log('no hits');
        client.create({
          index: 'webrtc',
          type: 'data',
          id: socket.id,
          body: {
            interest  : data.interest,
            match     : 'false',
            room      : socket.id,
            match_id  : 'null',
            location  : {
              lat   : data.lat,
              lon  : data.lon
            }
          }
        });
        /*save this room name in the client(the issuer)*/
        clients[socket.id].emit('join_room', {room:socket.id, match: false});

        /*join room for chat*/
        socket.join(hits[0]._source.room);
      } else {
        /*make a post to change match === true*/
        console.log('with interest');
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
            interest  : data.interest,
            match     : 'true',
            room      : hits[0]._source.room,
            match_id  : hits[0]._id,
            location  : {
              lat   : data.lat,
              lon  : data.lon
            }
          }
        });
        /* connect to the id of the first hits*/
        clients[socket.id].emit('join_room', {room:hits[0]._source.room, match: true});

        clients[hits[0]._source.room].emit('room_token', hits[0]._source.room);
        clients[socket.id].emit('room_token', hits[0]._source.room);

        /*message both of them they are connected*/
        clients[socket.id].emit('connected_peer');
        clients[hits[0]._source.room].emit('connected_peer');

        /*join room for chat*/
        socket.join(hits[0]._source.room);
      }
    });
  };
}());
