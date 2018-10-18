(function () {

    'use strict';

    var d = angular.module('app.directives', []);

    // ------------------------------------------------------------------------------
    d.directive('footerMain', function () {
        return {
            restrict: 'EA', //E = element, A = attribute, C = class, M = comment
            // <footer-main></footer-main>
            // replace: 'true', // >> error
            templateUrl: '/app/directives/footerMain.html'
        };
    });
    // ------------------------------------------------------------------------------
    d.directive('noConnectionToNodeError', function () {
        return {
            restrict: 'EA', //E = element, A = attribute, C = class, M = comment
            // <no-connection-to-node-error></no-connection-to-node-error>
            // replace: 'true', // >> error
            templateUrl: '/app/directives/noConnectionToNodeError.html'
        };
    });

    // ------------------------------------------------------------------------------

})();
