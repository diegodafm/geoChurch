define([
    'angular',
    'ui.router',
    'ng.router',
    'ui.bootstrap',
    './controllers/index'
 ], function (ng) {
     'use strict';

     return ng.module('app', [
         'ui.router',
         'ngRoute',
         'app.controllers'

     ]);
 });