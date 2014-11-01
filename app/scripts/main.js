(

    function () {

        'use strict';

        var paths = {
            jquery          : 'vendor/jquery/dist/jquery.min',
            domReady        : 'vendor/requirejs-domready/domReady',
            angular         : 'vendor/angularjs/angular.min',
            OpenLayers      : 'vendor/openLayers2/OpenLayers',
            googleMaps      : 'http://maps.google.com/maps/api/js?v=3&sensor=false',
            'ui.router'     : 'vendor/angular-ui-router/release/angular-ui-router.min',
            'ng.router'     : 'vendor/angular-route/angular-route.min',
            'ui.bootstrap'  : 'vendor/angular-bootstrap/ui-bootstrap-tpls.min'
        };

        var shim = {
            'angular': {
                deps: ['jquery'],
                exports: 'angular'
            },
            'OpenLayers': {
                exports: 'OpenLayers'
            },
            googleMaps:{
                exports: 'googleMaps'
            },
            'ui.router'     : ['angular'],
            'ng.router'     : ['angular'],
            'ui.bootstrap'  : ['angular']
        };

        requirejs.config( {
            "baseUrl": 'scripts',
            "paths": paths,
            "shim": shim,
            "deps": [
                './bootstrap'
            ]
        });
    }
    )();