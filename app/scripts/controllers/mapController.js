3/**
 * Created by Diego Alisson on 9/13/14.
 */
define(['./module','OpenLayers'], function (controllers, OpenLayers) {
    'use strict';
    controllers.controller('MapController', ['$scope' , function ($scope) {

        var map = new OpenLayers.Map( 'map');
        var layer = new OpenLayers.Layer.OSM( "Simple OSM Map");
        map.addLayer(layer);
        map.setCenter(
            new OpenLayers.LonLat(-44.198666 , -19.948557 ).transform(
                new OpenLayers.Projection("EPSG:4326"),
                map.getProjectionObject()
            ), 15
        );

    }]);
});