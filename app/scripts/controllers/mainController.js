3/**
 * Created by Diego Alisson on 9/13/14.
 */
define(['./module', 'socketIO'], function (controllers, io) {
    'use strict';
    controllers.controller('MainController', ['$scope' , function ($scope) {

        $scope.calendar = new Date();

        console.log($scope);
        console.log('HomeController controller');
    }]);
});