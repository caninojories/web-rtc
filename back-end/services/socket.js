(function() {
  'use strict';

  var elasticsearch = require('elasticsearch'),
      clients = {},
      client = new elasticsearch.Client({
        host: 'localhost:9200',
      });


  module.exports = function(socket) {
      clients[socket.id] = socket;

      console.log('client connected');
      socket.on('disconnect', disconnect);
      socket.on('close', function() {
        socket.disconnect();
      });



      /*chat*/
      socket.on('send_message', function(data) {
        socket.broadcast.to(data.room).emit('receive_message', data.message);
      });

      socket.on('videoRemoved', function(room) {
        socket.broadcast.to(room).emit('videoRemoved');
      });

      socket.on('find', function(data) {
        /* search for common interest */
        if (data.lat !== undefined && data.lon !== undefined && data.range !== undefined) {
          if (data.interest !== undefined) {
            /* location = true*/
            /* interest(tags) = true */
            io.elastic_search_location_with_interest(client, clients, socket, data);
          } else {
            /* location = true*/
            /* interest(tags) = false */
            io.elastic_search_location(client, clients, socket, data);
          }
        } else {
          if (data.interest !== undefined) {
            io.elastic_search_interest(client, clients, socket, data);
          } else {
            /* make a random choice */
            io.elastic_search_random(client, clients, socket, data);
          }
        }
      });

    function disconnect() {
      console.log('socket id');
      console.log(socket.id);
      /*search if we have this document*/
      client.search({
        index: 'webrtc',
        type: 'data',
        body: {
          query: {
            filtered: {
              /* first step we must know if the socket id is present*/
              filter: { term: { _id: socket.id }}
            }
          }
        }
      }).then(function (body) {
        var hits = body.hits.hits;
        console.log(hits[0]);
        if (hits.length !== 0) {
          /* if we have document delete it*/
          client.delete({
            index: 'webrtc',
            type: 'data',
            id: socket.id
          }).then(function(body) {
            if (hits[0]._source.match_id !== 'null') {
              client.update({
                index: 'webrtc',
                type: 'data',
                id : hits[0]._source.match_id.toString(),
                body: {
                  doc: {
                    match: 'false',
                    match_id: 'null'
                  }
                }
              });
            }
          });
        }
      });

      // if (socket.id) {
        //console.log(io.shortID.generate());
        // socket.id = io.shortID.generate();
      // }
      console.log('client disconnected');
    }
  };
}());
