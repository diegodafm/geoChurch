module.exports = function ( grunt ) {

	'use strict';

	grunt.loadNpmTasks( 'grunt-contrib-connect' );

    grunt.loadNpmTasks('grunt-express');

    grunt.loadNpmTasks('grunt-connect-socket.io');

    var path = '/app';

	grunt.initConfig({
  		connect: {
            server: {
                options: {
                    base: 'app',
                    keepalive: true,
                    port: 8000,
                    hostname: 'localhost',
                    onCreateServer: function(server, connect, options) {
                        var io = require('socket.io').listen(server);
                        var namespace = io.of('/namespace').on('connection', function(socket) {
                                socket.on('message', function(data) {
                                    socket.broadcast.send(data);
                                });
                            });
                    }
                }
            }
		},
        express: {
            myServer: {
                options: {
                    script: 'server.js',


                }
            }
        }
	});

    grunt.registerTask( 'default', [ 'connect' ] );
    grunt.registerTask( 'server', [ 'express:myServer' ] );
    grunt.registerTask( 'aaa', function() {

        grunt.log.ok('Init');

        var express = require('express')
            , http = require('http')
            , path = require('path');

        var app = express();

        // all environments
        app.set('port', process.env.PORT || 3000);



        grunt.log.ok('Init');
    });


}