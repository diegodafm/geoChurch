/**
 * Created by Diego Alisson on 9/13/14.
 */

define([
        'require',
        'angular',
        'app',
        'routes',
        'socketIO'
    ], function (require, ng, app, routes, socketIO) {
        'use strict';
        require(['domReady!'], function (document) {

            var namespace = socketIO.connect('/namespace');
            namespace.on('news', function (data) {
                console.log(data);
            });


            ng.bootstrap(document, ['app']);
        });
    });