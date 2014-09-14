define([
    'angular',
    'ui.router',
    'ng.router',
    './controllers/index'
 ], function (ng) {
     'use strict';

     return ng.module('app', [
         'ui.router',
         'ngRoute',
         'app.controllers'
     ]);
 });