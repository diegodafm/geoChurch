3/**
 * Created by Diego Alisson on 9/13/14.
 */
define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('MapController', ['$scope' , function ($scope) {

        $scope.calendar = new Date();

        console.log('scope');
        console.log($scope);
        console.log('mapController controller');

        $scope.london = {
            lat: 51.505,
            lon: -0.09,
            zoom: 4
        };
    }]);
});