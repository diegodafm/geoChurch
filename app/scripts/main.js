(

    function () {

        'use strict';

        var paths = {
            jquery          : 'vendor/jquery/dist/jquery.min',
            domReady        : 'vendor/requirejs-domready/domReady',
            angular         : 'vendor/angularjs/angular.min',
            goog            : 'vendor/requirejs-plugins/src/goog',
            openlayers      : 'vendor/openlayers3/src/ol/ol',
            'ui.router'     : 'vendor/angular-ui-router/release/angular-ui-router.min',
            'ng.router'     : 'vendor/angular-route/angular-route.min',
            'ui.bootstrap'  : 'vendor/angular-bootstrap/ui-bootstrap-tpls.min',
            'ng.openlayers' : 'vendor/angular-openlayers-directive/dist/angular-openlayers-directive.min'
        };

        var shim = {
            'angular': {
                deps: ['jquery'],
                exports: 'angular'
            },
            'ol': {
                deps: ['goog','openlayers'],
                exports: 'angular'
            },
            'ui.router'     : ['angular'],
            'ng.router'     : ['angular'],
            'ui.bootstrap'  : ['angular'],
            'ng.openlayers' : ['angular', 'ol']
        };

        requirejs.config( {
            "baseUrl": 'scripts',
            "paths": paths,
            "shim": shim,
            "deps": ['./bootstrap']
        });
    }
    )();