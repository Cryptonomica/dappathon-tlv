'use strict';

var app = angular.module('app', [
        'ngCookies',
        'ui.router',
        'yaru22.md', // https://github.com/yaru22/angular-md
        // ---- my:
        'app.ui.router',
        'app.controllers',
        'app.directives'
    ]
);

app.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        // 'self' - Allow same origin resource loads
        'self'
    ]);
});

// // see:
// // https://stackoverflow.com/questions/41460772/angularjs-how-to-remove-bang-prefix-from-url/41461312
// app.config(['$locationProvider', function ($locationProvider) {
//     $locationProvider.hashPrefix('');
// }]);

app.run([
    '$state',
    '$rootScope',
    '$window',
    '$sce',
    '$anchorScroll',
    '$location',
    '$log',
    function (
        $state,
        $rootScope,
        $window,
        $sce,
        $anchorScroll,
        $location,
        $log) {

        $rootScope.appVersion = '1.0.0';
        $log.debug('webapp started,  version: ', $rootScope.appVersion);

        /* ==== App data */

        $rootScope.copyrightOwner = "Cryptonomica";

        /* === Utility functions === */

        $rootScope.goTo = function (id) {
            // set the location.hash to the id of
            // the element you wish to scroll to.
            // $location.hash('about');
            $location.hash(id);
            // call $anchorScroll()
            $anchorScroll();
        };

        $rootScope.stateGo = function (state, parameter, parameterValue) {
            $state.go(state, {parameter: parameterValue});
        };

        $rootScope.stringIsNullUndefinedOrEmpty = function (str) {
            return typeof str === 'undefined' || str === null || str.length === 0;
        };

        $rootScope.unixTimeFromDate = function (date) {
            return Math.round(date.getTime() / 1000);
        };

        $rootScope.dateFromUnixTime = function (unixTime) {
            return new Date(unixTime * 1000);
        };

        /* https://codepen.io/shaikmaqsood/pen/XmydxJ/ */
        $rootScope.copyToClipboard = function (element) {
            // var $temp = $("<input>");
            var $temp = $("<textarea></textarea>");
            $("body").append($temp);
            // console.log('copy to clipboard: $(' + element + ').val() :');
            // console.log($(element).text());
            $temp.val(
                $(element).text()
                // $(element).val()
            ).select();
            document.execCommand("copy");
            $temp.remove();
        };

        $rootScope.saveAsFile = function (element, fileName) {
            // var textToSave = $(element).val();
            var textToSave = $(element).text();
            // console.log("textToSave as file:");
            // console.log(textToSave);
            var blob = new Blob([textToSave], {type: "text/plain;charset=utf-8"});
            $log.debug(blob);
            // uses https://eligrey.com/demos/FileSaver.js/
            saveAs(blob, fileName);
        };

        /* === Blockchain functions === */

        $rootScope.currentBlockNumber = null;
        $rootScope.refreshCurrentBlockNumber = function () {
            $rootScope.web3.eth.getBlockNumber(
                function (error, result) {
                    if (!error) {
                        $rootScope.currentBlockNumber = parseInt(result);
                        $rootScope.$apply();
                        $log.debug("$rootScope.currentBlockNumber: ", $rootScope.currentBlockNumber);
                    }
                }
            )
        };

        $rootScope.sessionStartedOnBlockNumber = null;
        $rootScope.getSessionStartOnBlockNumber = function () {
            $rootScope.web3.eth.getBlockNumber(
                function (error, result) {
                    if (!error) {
                        $rootScope.sessionStartedOnBlockNumber = parseInt(result);
                        $rootScope.$apply();
                        $log.debug("$rootScope.sessionStartedOnBlockNumber: ", $rootScope.sessionStartedOnBlockNumber);
                    } else {
                        $log.error("$rootScope.getSessionStartOnBlockNumber ERROR:");
                        $log.error(error);
                    }
                }
            )
        };

        /* === web3.js === */
        // example from:
        // https://github.com/trufflesuite/truffle-artifactor#artifactorgenerateoptions-networks
        $rootScope.networks = {
            "1": {
                "networkName": "Main Ethereum Network",
                "etherscanLinkPrefix": "https://etherscan.io/",
                "etherscanApiLink": "https://api.etherscan.io/"
            },
            "3": {
                "networkName": "Ropsten TestNet",
                "etherscanLinkPrefix": "https://ropsten.etherscan.io/",
                "etherscanApiLink": "https://api-ropsten.etherscan.io/"
            },
            "4": {        //
                "networkName": "Rinkeby TestNet",
                "etherscanLinkPrefix": "https://rinkeby.etherscan.io/",
                "etherscanApiLink": "https://api-rinkeby.etherscan.io/"
            },
            "42": {        //
                "networkName": "Kovan TestNet",
                "etherscanLinkPrefix": "https://kovan.etherscan.io/",
                "etherscanApiLink": "https://api-kovan.etherscan.io/"
            },
            "5777": {
                "networkName": "Ganache",
                "etherscanLinkPrefix": "https://etherscan.io/", // ?
                "etherscanApiLink": "https://api.etherscan.io/" // ?
            }
        };

        /* web3 instantiation */
        // to access web3 instance in browser console:
        // angular.element('body').scope().$root.web3
        // see 'NOTE FOR DAPP DEVELOPERS' on https://github.com/ethereum/mist/releases/tag/v0.9.0
        try {
            if (typeof window.web3 !== 'undefined') {
                $log.debug('web3 object presented by provider:', window.web3.currentProvider);
                $rootScope.web3 = new Web3(window.web3.currentProvider);
            } else {
                $rootScope.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
                if (!$rootScope.web3.isConnected()) {
                    $rootScope.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
                    if (!$rootScope.web3.isConnected()) {
                        $log.debug("[error] no connection to node");
                        $rootScope.web3 = null;
                        $rootScope.noConnectionToNodeError = true;
                    }
                }
            }
        } catch (error) {
            $log.error(error);
            $rootScope.noConnectionToNodeError = true;
        }

        $rootScope.currentNetwork = {};
        $rootScope.$apply(); // ?
        $log.debug("$rootScope.web3 :");
        $log.debug($rootScope.web3);

        if (!$rootScope.noConnectionToNodeError) {

            // !!! $rootScope.web3.isConnected() can be true even without real connection to node
            // just if MetaMask is running and trying to connect
            $log.debug("$rootScope.web3.isConnected():", $rootScope.web3.isConnected());
            // we can hack this:
            $rootScope.getNetworkError = true;

            $rootScope.web3.version.getNetwork(function (error, result) {
                    if (!error) {
                        // << MetaMask trick to avoid false $rootScope.web3.isConnected() result above;
                        $rootScope.getNetworkError = false;
                        $rootScope.currentNetwork.connected = true;

                        $log.debug("current network id:", result);
                        $rootScope.currentNetwork.network_id = result; // "3" for Ropsten, "1" for MainNet etc.
                        if (result === "1" || result === "2" || result === "3" || result === "4" || result === "42" || result === "5777") {
                            $rootScope.currentNetwork.networkName = $rootScope.networks[result].networkName;
                            $rootScope.currentNetwork.etherscanLinkPrefix = $rootScope.networks[result].etherscanLinkPrefix;
                            $rootScope.currentNetwork.etherscanApiLink = $rootScope.networks[result].etherscanApiLink;
                        } else {
                            $rootScope.currentNetwork.networkName = "unknown network";
                            $rootScope.currentNetwork.etherscanLinkPrefix = $rootScope.networks["1"].etherscanLinkPrefix;
                            $rootScope.currentNetwork.etherscanApiLink = $rootScope.networks["1"].etherscanApiLink;
                        }
                        $log.debug("$rootScope.currentNetwork.networkName:", $rootScope.currentNetwork.networkName);
                        $rootScope.$apply(); // needed here
                    } else {
                        $rootScope.getNetworkError = true;
                        $rootScope.$apply();
                        $log.debug("$rootScope.getNetworkError: ", $rootScope.getNetworkError);
                        $log.debug(error);
                    }
                }
            );

            $rootScope.web3.version.getNode(function (error, result) {
                    if (error) {
                        $log.debug(error);
                    } else {
                        $rootScope.currentNetwork.node = result;
                        $rootScope.$apply();
                        $log.debug('web3.version.node: ' + $rootScope.currentNetwork.node);
                        // "Geth/v1.7.2-stable-1db4ecdc/linux-amd64/go1.9"
                    }
                }
            );

            $rootScope.web3.version.getEthereum(function (error, result) {
                    if (error) {
                        $log.debug(error);
                    } else {
                        $rootScope.currentNetwork.ethereumProtocolVersion = result;
                        $rootScope.$apply();
                        // $log.debug('[app.run] web3.version.ethereum: ' + $rootScope.currentNetwork.ethereumProtocolVersion);
                        // the Ethereum protocol version
                    }
                }
            );

            if ($rootScope.web3.eth.accounts.length > 0) {
                if (!$rootScope.web3.eth.defaultAccount) {
                    $rootScope.web3.eth.defaultAccount = $rootScope.web3.eth.accounts[0];
                    $rootScope.$apply(); // <<< needed
                }
            } else {
                $log.warn("accounts not detected");
                $rootScope.accountNotDetectedError = true;
                $rootScope.$apply(); // <<< (?) needed
            }

            $rootScope.getSessionStartOnBlockNumber();
            $rootScope.refreshCurrentBlockNumber();

        } else { // <<< -------- if no connection to Ethereum Network
            $rootScope.currentNetwork.networkName = 'no connection to network';
            $rootScope.$apply(); //
        }

    } // end main func
]);
