define([
    'angular',
    'ui.router',
    'ng.router',
    'ui.bootstrap',
    'ng.openlayers',
    './controllers/index'
 ], function (ng) {
     'use strict';

     return ng.module('app', [
         'ui.router',
         'ngRoute',
         'openlayers-directive',
         'app.controllers'

     ]);
 });