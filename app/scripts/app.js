angular.module('geoChurch', ['ui.router'])
    .config(function($stateProvider, $urlRouterProvider){

        // For any unmatched url, redirect to /main
        $urlRouterProvider.otherwise("/main");
        //
        // Now set up the states
        $stateProvider
            .state('main', {
                url: "/main",
                templateUrl: "templates/main.html"
            })
            .state('main.profile', {
                url: "/profile",
                templateUrl: "templates/profile.html",
                controller: function($scope) {
                    $scope.items = ["A", "List", "Of", "Items"];
                }
            })
            .state('state2', {
                url: "/state2",
                templateUrl: "templates/state2.html"
            })
            .state('state2.list', {
                url: "/list",
                templateUrl: "partials/state2.list.html",
                controller: function($scope) {
                    $scope.things = ["A", "Set", "Of", "Things"];
                }
            });
    });