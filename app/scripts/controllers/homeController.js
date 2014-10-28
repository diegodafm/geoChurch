3/**
 * Created by Diego Alisson on 9/13/14.
 */
define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('MainController', ['$scope' , function ($scope) {

        $scope.calendar = new Date();

        console.log('scope');
        console.log($scope);
        console.log('HomeController controller');
    }]);
});