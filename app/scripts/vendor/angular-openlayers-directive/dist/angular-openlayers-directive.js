(function() {

"use strict";

angular.module("openlayers-directive", []).directive('openlayers', ["$log", "$q", "olHelpers", "olMapDefaults", "olData", function ($log, $q, olHelpers, olMapDefaults, olData) {
    var _olMap;
    return {
        restrict: "EA",
        replace: true,
        scope: {
            center: '=center',
            defaults: '=defaults',
            layers: '=layers',
            events: '=events'
        },
        transclude: true,
        template: '<div class="angular-openlayers-map"><div ng-transclude></div></div>',
        controller: ["$scope", function ($scope) {
            _olMap = $q.defer();
            this.getMap = function () {
                return _olMap.promise;
            };

            this.getOpenlayersScope = function() {
                return $scope;
            };
        }],

        link: function(scope, element, attrs) {
            var isDefined = olHelpers.isDefined,
                createLayer = olHelpers.createLayer,
                createProjection = olHelpers.createProjection,
                setEvents = olHelpers.setEvents,
                defaults = olMapDefaults.setDefaults(scope.defaults, attrs.id);

            // Set width and height if they are defined
            if (isDefined(attrs.width)) {
                if (isNaN(attrs.width)) {
                    element.css('width', attrs.width);
                } else {
                    element.css('width', attrs.width + 'px');
                }
            }

            if (isDefined(attrs.height)) {
                if (isNaN(attrs.height)) {
                    element.css('height', attrs.height);
                } else {
                    element.css('height', attrs.height + 'px');
                }
            }

            var controls = ol.control.defaults(defaults.controls);
            var interactions = ol.interaction.defaults(defaults.interactions);
            var projection = createProjection(defaults.view.projection);

            // Create the Openlayers Map Object with the options
            var map = new ol.Map({
                target: element[0],
                controls: controls,
                interactions: interactions,
                renderer: defaults.renderer,
                view: new ol.View({
                    projection: projection,
                    maxZoom: defaults.view.maxZoom,
                    minZoom: defaults.view.minZoom,
                })
            });

            // If no layer is defined, set the default tileLayer
            if (!isDefined(attrs.layers)) {
                var layer = createLayer(defaults.layers.main);
                map.addLayer(layer);
            }

            // If no events ared defined, set the default events
            if (!isDefined(attrs.events)) {
                setEvents(defaults.events, map, scope);
            }

            if (!isDefined(attrs.center)) {
                var view = map.getView();
                view.setCenter([ defaults.center.lon, defaults.center.lat ]);
                view.setZoom(defaults.center.zoom);
            }

            // Resolve the map object to the promises
            olData.setMap(map, attrs.id);
            _olMap.resolve(map);
        }
    };
}]);

angular.module("openlayers-directive").directive('center', ["$log", "$location", "olMapDefaults", "olHelpers", function ($log, $location, olMapDefaults, olHelpers) {
    return {
        restrict: "A",
        scope: false,
        replace: false,
        require: 'openlayers',

        link: function(scope, element, attrs, controller) {
            var safeApply         = olHelpers.safeApply,
                isValidCenter     = olHelpers.isValidCenter,
                isDefined         = olHelpers.isDefined,
                isArray           = olHelpers.isArray,
                isNumber          = olHelpers.isNumber,
                isSameCenterOnMap = olHelpers.isSameCenterOnMap,
                equals            = olHelpers.equals,
                olScope           = controller.getOpenlayersScope();

            controller.getMap().then(function(map) {
                var defaults = olMapDefaults.getDefaults(attrs.id),
                    center = olScope.center;

                var view = map.getView();
                var setCenter = function(view, projection, newCenter) {
                    if (newCenter.projection === projection) {
                        view.setCenter([ newCenter.lon, newCenter.lat ]);
                    } else {
                        view.setCenter(ol.proj.transform([ newCenter.lon, newCenter.lat ], projection, newCenter.projection));
                    }
                };

                if (!center.projection) {
                    if (defaults.view.projection !== 'pixel') {
                        center.projection = defaults.center.projection;
                    } else {
                        center.projection = defaults.view.projection;
                    }
                }

                if (attrs.center.search("-") !== -1) {
                    $log.error('[AngularJS - Openlayers] The "center" variable can\'t use a "-" on his key name: "' + attrs.center + '".');
                    setCenter(view, defaults.view.projection, defaults.center);
                    return;
                }

                if (!isValidCenter(center)) {
                    $log.warn("[AngularJS - Openlayers] invalid 'center'");
                    center = angular.copy(defaults.center);
                }

                if (!isNumber(center.zoom)) {
                    center.zoom = 1;
                }

                setCenter(view, defaults.view.projection, center);
                view.setZoom(center.zoom);

                var centerUrlHash;
                if (center.centerUrlHash === true) {
                    var extractCenterFromUrl = function() {
                        var search = $location.search();
                        var centerParam;
                        if (isDefined(search.c)) {
                            var cParam = search.c.split(":");
                            if (cParam.length === 3) {
                                centerParam = {
                                    lat: parseFloat(cParam[0]),
                                    lon: parseFloat(cParam[1]),
                                    zoom: parseInt(cParam[2], 10)
                                };
                            }
                        }
                        return centerParam;
                    };
                    centerUrlHash = extractCenterFromUrl();

                    olScope.$on('$locationChangeSuccess', function(event) {
                        var scope = event.currentScope;
                        var urlCenter = extractCenterFromUrl();
                        if (isDefined(urlCenter) && !isSameCenterOnMap(urlCenter, map)) {
                            scope.center = {
                                lat: urlCenter.lat,
                                lon: urlCenter.lon,
                                zoom: urlCenter.zoom
                            };
                        }
                    });
                }

                var geolocation;
                olScope.$watch("center", function(center) {
                    if (!center.projection) {
                        center.projection = defaults.center.projection;
                    }

                    if (center.autodiscover) {
                        if (!geolocation) {
                            geolocation = new ol.Geolocation({
                                projection: ol.proj.get(defaults.view.projection)
                            });

                            geolocation.on('change', function() {
                                if (center.autodiscover) {
                                    var location = geolocation.getPosition();
                                    safeApply(olScope, function(scope) {
                                        scope.center.lat = location[1];
                                        scope.center.lon = location[0];
                                        scope.center.zoom = 12;
                                        scope.center.autodiscover = false;
                                        geolocation.setTracking(false);
                                    });
                                }
                            });
                        }
                        geolocation.setTracking(true);
                        return;
                    }

                    if (!isValidCenter(center)) {
                        $log.warn("[AngularJS - Openlayers] invalid 'center'");
                        center = defaults.center;
                    }

                    var viewCenter = view.getCenter();
                    if (viewCenter) {
                        if (defaults.view.projection === 'pixel') {
                            view.setCenter(center.coord);
                            return;
                        }
                        var actualCenter = ol.proj.transform(viewCenter, center.projection, defaults.view.projection);
                        if (!equals({ lat: actualCenter[1], lon: actualCenter[0] }, { lat: center.lat, lon: center.lon })) {
                            setCenter(view, defaults.view.projection, center);
                        }
                    }

                    if (view.getZoom() !== center.zoom) {
                        view.setZoom(center.zoom);
                    }
                }, true);

                view.on('change:resolution', function() {
                    safeApply(olScope, function(scope) {
                        scope.center.zoom = view.getZoom();

                        // Calculate the bounds if needed
                        if (isArray(scope.center.bounds)) {
                            var extent = view.calculateExtent(map.getSize());
                            scope.center.bounds = ol.proj.transform(extent, scope.center.projection, defaults.view.projection);
                        }
                    });
                });

                view.on("change:center", function() {
                    safeApply(olScope, function(scope) {
                        var center = map.getView().getCenter();
                        if (defaults.view.projection === 'pixel') {
                            scope.center.coord = center;
                            return;
                        }

                        var proj = ol.proj.transform(center, scope.center.projection, defaults.view.projection);
                        if (scope.center) {
                            scope.center.lat = proj[1];
                            scope.center.lon = proj[0];

                            // Calculate the bounds if needed
                            if (isArray(scope.center.bounds)) {
                                var extent = view.calculateExtent(map.getSize());
                                scope.center.bounds = ol.proj.transform(extent, scope.center.projection, defaults.view.projection);
                            }
                        }
                    });
                });

            });
        }
    };
}]);

angular.module("openlayers-directive").directive('layers', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function ($log, $q, olData, olMapDefaults, olHelpers) {
    var _olLayers;

    return {
        restrict: "A",
        scope: false,
        replace: false,
        require: 'openlayers',
        controller: function () {
            _olLayers = $q.defer();
            this.getLayers = function() {
                return _olLayers.promise;
            };
        },
        link: function(scope, element, attrs, controller) {
            var isDefined   = olHelpers.isDefined,
                equals      = olHelpers.equals,
                olLayers    = {},
                olScope     = controller.getOpenlayersScope(),
                createLayer = olHelpers.createLayer;

            controller.getMap().then(function(map) {
                var defaults = olMapDefaults.getDefaults(attrs.id),
                    projection = map.getView().getProjection();
                olScope.$watch("layers", function(layers, oldLayers) {
                    var name, layer = layers[Object.keys(layers)[0]];
                    if (!isDefined(layer) || !isDefined(layer.source) || !isDefined(layer.source.type)) {
                        $log.warn("[AngularJS - OpenLayers] At least one layer has to be defined.");
                        layers = angular.copy(defaults.layers);
                    }

                    // Delete non existent layers from the map
                    for (name in olLayers) {
                        layer = olLayers[name];
                        if (!layers.hasOwnProperty(name)) {
                            // Remove from the map if it's on it
                            var activeLayers = map.getLayers();
                            for (var i in activeLayers) {
                                if (activeLayers[i] === layer) {
                                    map.removeLayer(layers);
                                }
                            }
                            delete olLayers[name];
                        }
                    }

                    // add new layers
                    for (name in layers) {
                        layer = layers[name];
                        var olLayer;
                        if (!olLayers.hasOwnProperty(name)) {
                            olLayer = createLayer(layers[name], projection);
                            if (isDefined(olLayer)) {
                                olLayers[name] = olLayer;
                                map.addLayer(olLayer);
                            }
                        } else {
                            layer = layers[name];
                            var oldLayer = oldLayers[name];
                            olLayer = olLayers[name];
                            if (isDefined(oldLayer) && !equals(layer, oldLayer)) {
                                if (!equals(layer.source, oldLayer.source)) {
                                    map.removeLayer(olLayer);
                                    delete olLayers[name];
                                    var l = createLayer(layer, projection);
                                    map.addLayer(l);
                                    olLayers[name] = l;
                                }

                                if (layer.opacity && layer.opacity !== oldLayer.opacity) {
                                    olLayer.setOpacity(layer.opacity);
                                }
                            }
                        }
                    }
                }, true);
                // We can resolve the layer promises
                _olLayers.resolve(olLayers);
                olData.setLayers(olLayers, attrs.id);

            });
        }
    };
}]);

angular.module("openlayers-directive").directive('events', ["$log", "$q", "olData", "olMapDefaults", "olHelpers", function ($log, $q, olData, olMapDefaults, olHelpers) {
    return {
        restrict: "A",
        scope: false,
        replace: false,
        require: [ 'openlayers', 'layers' ],
        link: function(scope, element, attrs, controller) {
            var setEvents = olHelpers.setEvents,
                isDefined = olHelpers.isDefined,
                mapController = controller[0],
                olScope     = mapController.getOpenlayersScope();

            mapController.getMap().then(function(map) {

                var getLayers;
                if (isDefined(controller[1])) {
                    getLayers = controller[1].getLayers;
                } else {
                    getLayers = function() {
                        var deferred = $q.defer();
                        deferred.resolve();
                        return deferred.promise;
                    };
                }

                getLayers().then(function(layers) {
                    olScope.$watch("events", function(events) {
                        setEvents(events, map, olScope, layers);
                    });
                });
            });
        }
    };
}]);

angular.module("openlayers-directive").service('olData', ["$log", "$q", "olHelpers", function ($log, $q, olHelpers) {
    var obtainEffectiveMapId = olHelpers.obtainEffectiveMapId;

    var maps = {},
        layers = {};

    var setResolvedDefer = function(d, mapId) {
        var id = obtainEffectiveMapId(d, mapId);
        d[id].resolvedDefer = true;
    };

    var getUnresolvedDefer = function(d, mapId) {
        var id = obtainEffectiveMapId(d, mapId),
            defer;

        if (!angular.isDefined(d[id]) || d[id].resolvedDefer === true) {
            defer = $q.defer();
            d[id] = {
                defer: defer,
                resolvedDefer: false
            };
        } else {
            defer = d[id].defer;
        }
        return defer;
    };

    var getDefer = function(d, mapId) {
        var id = obtainEffectiveMapId(d, mapId),
            defer;
        if (!angular.isDefined(d[id]) || d[id].resolvedDefer === false) {
            defer = getUnresolvedDefer(d, mapId);
        } else {
            defer = d[id].defer;
        }
        return defer;
    };

    this.setMap = function(olMap, scopeId) {
        var defer = getUnresolvedDefer(maps, scopeId);
        defer.resolve(olMap);
        setResolvedDefer(maps, scopeId);
    };

    this.getMap = function(scopeId) {
        var defer = getDefer(maps, scopeId);
        return defer.promise;
    };

    this.getLayers = function(scopeId) {
        var defer = getDefer(layers, scopeId);
        return defer.promise;
    };

    this.setLayers = function(olLayers, scopeId) {
        var defer = getUnresolvedDefer(layers, scopeId);
        defer.resolve(olLayers);
        setResolvedDefer(layers, scopeId);
    };

}]);

angular.module("openlayers-directive").factory('olHelpers', ["$q", "$log", function ($q, $log) {
    var isDefined = function(value) {
        return angular.isDefined(value);
    };

    var bingImagerySets = [
      'Road',
      'Aerial',
      'AerialWithLabels',
      'collinsBart',
      'ordnanceSurvey'
    ];

    var mapQuestLayers = [ 'osm', 'sat', 'hyb' ];

    var _detectLayerType = function(layer) {
        if (layer.type) {
            return layer.type;
        } else {
            switch(layer.source.type) {
                case 'ImageStatic':
                    return 'Image';
                case 'GeoJSON':
                    return 'Vector';
                case 'TopoJSON':
                    return 'Vector';
                default:
                  return 'Tile';
            }
        }
    };

    var _createProjection = function(projection) {
        var oProjection;

        switch(projection) {
            case 'EPSG:3857':
                oProjection = new ol.proj.get(projection);
                break;
            case 'pixel':
                oProjection = new ol.proj.Projection({
                    code: 'pixel',
                    units: 'pixels',
                    extent: [ 0, 0, 4500, 2234 ]
                });
                break;
        }

        return oProjection;
    };

    var createSource = function(source, projection) {
        var oSource;

        switch(source.type) {
            case 'OSM':
                if (source.attribution) {
                    oSource = new ol.source.OSM({
                        attributions: [
                          new ol.Attribution({ html: source.attribution }),
                          ol.source.OSM.DATA_ATTRIBUTION
                        ]
                    });
                } else {
                    oSource = new ol.source.OSM();
                }

                if (source.url) {
                    oSource.setUrl(source.url);
                }

                break;
            case 'BingMaps':
                if (!source.key) {
                    $log.error("[AngularJS - Openlayers] - You need an API key to show the Bing Maps.");
                    return;
                }

                oSource = new ol.source.BingMaps({
                    key: source.key,
                    imagerySet: source.imagerySet?source.imagerySet:bingImagerySets[0]
                });

                break;

            case 'MapQuest':
                if (!source.layer || mapQuestLayers.indexOf(source.layer) === -1) {
                    $log.error("[AngularJS - Openlayers] - MapQuest layers needs a valid 'layer' property.");
                    return;
                }

                oSource = new ol.source.MapQuest({
                    layer: source.layer
                });

                break;

            case 'GeoJSON':
                if (!(source.features || source.url)) {
                    $log.error("[AngularJS - Openlayers] - You need a GeoJSON features property to add a GeoJSON layer.");
                    return;
                }

                if (source.url) {
                    oSource = new ol.source.GeoJSON({
                        projection: projection,
                        url: source.url
                    });
                } else {
                    oSource = new ol.source.GeoJSON(source.geojson);
                }

                break;
            case 'TopoJSON':
                if (!(source.features || source.url)) {
                    $log.error("[AngularJS - Openlayers] - You need a TopoJSON features property to add a GeoJSON layer.");
                    return;
                }

                if (source.url) {
                    oSource = new ol.source.TopoJSON({
                        projection: projection,
                        url: source.url
                    });
                } else {
                    oSource = new ol.source.TopoJSON(source.topojson);
                }
                break;
            case 'TileJSON':
                oSource = new ol.source.TileJSON({
                    url: source.url,
                    crossOrigin: 'anonymous'
                });
                break;
            case 'ImageStatic':
                if (!source.url || !angular.isArray(source.imageSize) || source.imageSize.length !== 2) {
                    $log.error("[AngularJS - Openlayers] - You need a image URL to create a ImageStatic layer.");
                    return;
                }

                oSource = new ol.source.ImageStatic({
                    url: source.url,
                    imageSize: source.imageSize,
                    projection: projection,
                    imageExtent: projection.getExtent()
                });
                break;
        }

        return oSource;
    };

    return {
        // Determine if a reference is defined
        isDefined: isDefined,

        // Determine if a reference is a number
        isNumber: function(value) {
            return angular.isNumber(value);
        },

        createProjection: _createProjection,

        // Determine if a reference is defined and not null
        isDefinedAndNotNull: function(value) {
            return angular.isDefined(value) && value !== null;
        },

        // Determine if a reference is a string
        isString: function(value) {
            return angular.isString(value);
        },

        // Determine if a reference is an array
        isArray: function(value) {
            return angular.isArray(value);
        },

        // Determine if a reference is an object
        isObject: function(value) {
            return angular.isObject(value);
        },

        // Determine if two objects have the same properties
        equals: function(o1, o2) {
            return angular.equals(o1, o2);
        },

        isValidCenter: function(center) {
            return angular.isDefined(center) &&
                   (angular.isNumber(center.lat) && angular.isNumber(center.lon) ||
                   (angular.isArray(center.coord) && center.coord.length === 2 && angular.isNumber(center.coord[0]) && angular.isNumber(center.coord[1])) ||
                   (angular.isArray(center.bounds) && center.bounds.length === 4 &&
                   angular.isNumber(center.bounds[0]) && angular.isNumber(center.bounds[1]) &&
                   angular.isNumber(center.bounds[1]) && angular.isNumber(center.bounds[2])));
        },

        safeApply: function($scope, fn) {
            var phase = $scope.$root.$$phase;
            if (phase === '$apply' || phase === '$digest') {
                $scope.$eval(fn);
            } else {
                $scope.$apply(fn);
            }
        },

        isSameCenterOnMap: function(center, map) {
            var mapCenter = map.getView().getCenter();
            var zoom = map.getView().getZoom();
            if (mapCenter[1].toFixed(4) === center.lat.toFixed(4) &&
                mapCenter[1].toFixed(4) === center.lon.toFixed(4) &&
                zoom === center.zoom) {
                  return true;
            }
            return false;
        },

        obtainEffectiveMapId: function(d, mapId) {
            var id, i;
            if (!angular.isDefined(mapId)) {
                if (Object.keys(d).length === 1) {
                    for (i in d) {
                        if (d.hasOwnProperty(i)) {
                            id = i;
                        }
                    }
                } else if (Object.keys(d).length === 0) {
                    id = "main";
                } else {
                    $log.error("[AngularJS - Openlayers] - You have more than 1 map on the DOM, you must provide the map ID to the olData.getXXX call");
                }
            } else {
                id = mapId;
            }
            return id;
        },

        generateUniqueUID: function() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

        setEvents: function(events, map, scope, layers) {
            if (isDefined(events)) {
                if (isDefined(layers)) {
                    if (isDefined(events.layers) && angular.isArray(events.layers.vector)) {
                        angular.forEach(events.layers.vector, function(eventType) {
                            angular.element(map.getViewport()).on(eventType, function(evt) {
                                var pixel = map.getEventPixel(evt);
                                var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
                                    return feature;
                                });
                                scope.$emit('openlayers.geojson.' + eventType, feature);
                            });
                        });
                    }
                }
            }
        },

        detectLayerType: _detectLayerType,

        createLayer: function(layer, projection) {
            var oLayer,
                type = _detectLayerType(layer),
                oSource = createSource(layer.source, projection);

            switch(type) {
                case 'Image':
                    oLayer = new ol.layer.Image({ source: oSource });
                    break;
                case 'Tile':
                    oLayer = new ol.layer.Tile({ source: oSource });
                    break;
                case 'Vector':
                    if (layer.style) {
                        var style = new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: layer.style.fill.color
                            }),
                            stroke: new ol.style.Stroke({
                                color: layer.style.stroke.color,
                                width: layer.style.stroke.width
                            })
                        });
                        oLayer = new ol.layer.Vector({ source: oSource, style: style });
                    } else {
                        oLayer = new ol.layer.Vector({ source: oSource });
                    }
                    break;
            }

            if (angular.isNumber(layer.opacity)) {
                oLayer.setOpacity(layer.opacity);
            }
            return oLayer;
        }
    };
}]);

angular.module("openlayers-directive").factory('olMapDefaults', ["$q", "olHelpers", function ($q, olHelpers) {
    var _getDefaults = function() {
        return {
            interactions: {
                dragRotate: true,
                doubleClickZoom: true,
                dragPan: true,
                pinchRotate: true,
                pinchZoom: true,
                keyboardPan: true,
                keyboardZoom: true,
                mouseWheelZoom: true,
                dragZoom: true
            },
            view: {
                projection: 'EPSG:4326',
                minZoom: undefined,
                maxZoom: undefined
            },
            layers: {
                main: {
                    type: 'Tile',
                    source: {
                        type: 'OSM'
                    }
                }
            },
            center: {
                lat: 0,
                lon: 0,
                zoom: 1,
                autodiscover: false,
                bounds: [],
                centerUrlHash: false,
                projection: 'EPSG:3857'
            },
            controls: {
                attribution: true,
                rotate: false,
                zoom: true
            },
            events: {
                map: [ 'click' ]
            },
            renderer: 'canvas'
        };
    };

    var isDefined = olHelpers.isDefined,
        obtainEffectiveMapId = olHelpers.obtainEffectiveMapId,
        defaults = {};

    // Get the _defaults dictionary, and override the properties defined by the user
    return {
        getDefaults: function (scopeId) {
            var mapId = obtainEffectiveMapId(defaults, scopeId);
            return defaults[mapId];
        },

        setDefaults: function(userDefaults, scopeId) {
            var newDefaults = _getDefaults();

            if (isDefined(userDefaults)) {

                if (isDefined(userDefaults.layers)) {
                    newDefaults.layers = angular.copy(userDefaults.layers);
                }

                if (isDefined(userDefaults.controls)) {
                    newDefaults.controls = angular.copy(userDefaults.controls);
                }

                if (isDefined(userDefaults.interactions)) {
                    newDefaults.interactions = angular.copy(userDefaults.interactions);
                }

                if (isDefined(userDefaults.renderer)) {
                    newDefaults.renderer = userDefaults.renderer;
                }

                if (isDefined(userDefaults.view)) {
                    newDefaults.view.maxZoom = userDefaults.view.maxZoom || newDefaults.view.maxZoom;
                    newDefaults.view.minZoom = userDefaults.view.minZoom || newDefaults.view.minZoom;
                    newDefaults.view.projection = userDefaults.view.projection || newDefaults.view.projection;
                }

            }

            var mapId = obtainEffectiveMapId(defaults, scopeId);
            defaults[mapId] = newDefaults;
            return newDefaults;
        }
    };
}]);

}());