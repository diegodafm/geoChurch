/**
 * Created by Diego Alisson on 9/13/14.
 */

define([
    './app'
], function (app) {
     'use strict';
     return app.config(['$routeProvider','$stateProvider', function ($routeProvider, $stateProvider) {
         $routeProvider.otherwise({
             redirectTo: '/'
         });

         $stateProvider
             .state('home', {
                 url: '/home',
                 templateUrl: 'templates/header.html',
                 controller: 'HomeController'
             });
     }]);
 });