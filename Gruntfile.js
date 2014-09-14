module.exports = function ( grunt ) {

	'use strict';

	grunt.loadNpmTasks( 'grunt-contrib-connect' );

    var path = '/app';

	grunt.initConfig({
  		connect: {
			server: {
				options: {
					port: 9001,
					base: 'app',
					keepalive: true
				}
			}
		}
	});

	grunt.registerTask( 'default', [ 'connect' ] );
}