'use strict';

/**
 * see example:
 * https://github.com/maximepvrt/angular-google-gapi/blob/gh-pages/app/router.js
 */

var router = angular.module('app.ui.router', []);

router.config(['$urlRouterProvider',
    function ($urlRouterProvider) {
        $urlRouterProvider.otherwise("/tokens");
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
            .state('code', {
                url: '/code',
                controller: 'app.code',
                templateUrl: 'app/code/source.html'
            })
            .state('help', {
                url: '/help',
                controller: 'app.help',
                templateUrl: 'app/help/help.html'
            })
    } // end of function ($stateProvider)..
]);
