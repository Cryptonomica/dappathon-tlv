'use strict';

/**
 * see example:
 * https://github.com/maximepvrt/angular-google-gapi/blob/gh-pages/app/router.js
 */

var router = angular.module('app.ui.router', []);

router.config(['$urlRouterProvider',
    function ($urlRouterProvider) {
        $urlRouterProvider.otherwise("/");
    }
]);

router.config(['$stateProvider',
    function ($stateProvider) {
        $stateProvider
            .state('tokens', {
                url: '/',
                controller: 'app.tokens',
                templateUrl: 'app/tokens/tokens.html'
            })
    } // end of function ($stateProvider)..
]);
