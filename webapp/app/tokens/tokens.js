'use strict';
var controller_name = "app.tokens";
var controller = angular.module(controller_name, []);

// https://docs.angularjs.org/api/ng/provider/$logProvider
controller.config(function ($logProvider) {
    // $logProvider.debugEnabled(false);
    $logProvider.debugEnabled(true);
});

controller.controller(controller_name, [
    '$scope',
    '$rootScope',
    '$log',
    '$state',
    function tokensCtrl($scope,
                        $rootScope,
                        $log,
                        $state) {

        $log.debug("controller", controller_name, "started");

        // >>> start creating contract instance:
        var contractName = "Shares";

        var truffleArtifactPath = "smartcontracts/" + contractName + ".json";

        if ($rootScope.web3 && $rootScope.web3.version && $rootScope.web3.version.network) {
            $log.debug("starting contract creation");
        } else {
            return;
        }

        $.getJSON(truffleArtifactPath, function (truffleArtifactJSON) { // async

            $log.debug('[' + contractName + '] truffleArtifactJSON:');
            $log.debug(truffleArtifactJSON);

            var truffleContract = TruffleContract(truffleArtifactJSON);

            $log.debug('[' + contractName + '] truffleContract:');
            $log.debug(truffleContract);

            var contractAddress = truffleContract.networks[$rootScope.web3.version.network].address;
            $log.debug("truffleContract.networks[$rootScope.web3.version.network].address:");
            $log.debug(truffleContract.networks[$rootScope.web3.version.network].address);

            truffleContract.network_id = $rootScope.currentNetwork.network_id;
            truffleContract.setProvider($rootScope.web3.currentProvider);

            truffleContract
                .at(contractAddress)
                .then(function (instance) {

                    /* --- contract instance: */

                    $scope.contract = instance;
                    $scope.$apply();

                    $log.debug('[' + contractName + '] $scope.contract:');
                    $log.debug($scope.contract);

                    $scope.getEthBalanceOfDefaultAccount = function () {
                        if ($rootScope.stringIsNullUndefinedOrEmpty($rootScope.web3.eth.defaultAccount)) {
                            return;
                        }
                        $scope.getEthBalanceOfDefaultAccountWorking = true;
                        $rootScope.web3.eth.getBalance($rootScope.web3.eth.defaultAccount, function (error, result) {
                                if (result) {
                                    $scope.ethBalanceOfDefaultAccount = $rootScope.web3.fromWei(result.toNumber(), 'ether');
                                    $log.debug("$scope.ethBalanceOfDefaultAccount:", $scope.ethBalanceOfDefaultAccount);
                                    $scope.getEthBalanceOfDefaultAccountWorking = false;
                                    $scope.$apply(); //
                                }
                            }
                        );
                    }; // end of $scope.getEthBalanceOfDefaultAccount

                    $scope.refreshContractEthBalance = function () {
                        $scope.refreshContractEthBalanceIsWorking = true;
                        $rootScope.web3.eth.getBalance($scope.contract.address, function (error, result) {
                            if (!error) {
                                $scope.contractEthBalance = result;
                                $log.debug("$scope.contractEthBalance:", $scope.contractEthBalance);
                                $scope.refreshContractEthBalanceIsWorking = false;
                            } else {
                                $log.debug("$scope.refreshContractEthBalance ERROR:", error);
                                $scope.refreshContractEthBalanceIsWorking = false;
                            }
                        });

                        $scope.contract.totalSupply.call()
                            .then(function (totalSupply) {
                                    $scope.totalSupply = totalSupply.toNumber();
                                    $scope.$apply(); // <<< needed
                                    $log.log('Total supply: ' + $scope.totalSupply);
                                }
                            ).catch(function (error) {
                            $scope.alertDanger = error.toString();
                            $log.error(error);
                        });

                    };

                    $scope.getTotalSupply = function () {
                        $scope.contract.totalSupply.call()
                            .then(function (totalSupply) {
                                    $scope.totalSupply = totalSupply.toNumber();
                                    $scope.$apply(); // <<< needed
                                    $log.log('Total supply: ' + $scope.totalSupply);
                                }
                            ).catch(function (error) {
                            $scope.alertDanger = error.toString();
                            $log.error(error);
                        });
                    };

                    $scope.getDecimals = function () {
                        $scope.contract.decimals.call().then(function (decimals) {
                                $scope.decimals = decimals.toNumber();
                                $scope.$apply(); // <<< needed
                                $log.log('decimals: ' + $scope.decimals);
                            }
                        ).catch(function (error) {
                            // $scope.alertDanger = error.toString();
                            $log.error(error);
                        });
                    };

                    $scope.getSymbol = function () {
                        $scope.contract.symbol.call().then(function (symbol) {
                                $scope.symbol = symbol;
                                $log.log('symbol: ' + $scope.symbol);
                                $scope.$apply(); // <<< needed
                            }
                        ).catch(function (error) {
                            // $scope.alertDanger = error.toString();
                            $log.error(error);
                        });
                    };

                    $scope.getBalanceOfUser = function () {
                        $scope.getBalanceOfUserWorking = true;
                        $scope.contract.balanceOf.call($rootScope.web3.eth.defaultAccount).then(function (balance) {
                                $scope.balance = balance.toNumber();
                                $scope.getBalanceOfUserWorking = false;
                                $scope.$apply(); // <<< needed
                                $log.log('$scope.balance:', $scope.balance);
                            }
                        ).catch(function (error) {
                            // $scope.alertDanger = error.toString();
                            $log.error(error);
                            $scope.getBalanceOfUserWorking = false;
                        });
                    };

                    $scope.checkBalance = function () {
                        if ($rootScope.stringIsNullUndefinedOrEmpty($scope.addressToCheckTokenBalance)) {
                            return;
                        }
                        $scope.checkBalanceWorking = true;
                        $scope.contract.balanceOf.call($scope.addressToCheckTokenBalance).then(function (checkBalanceResult) {
                                $scope.checkBalanceResult = checkBalanceResult.toNumber();
                                $scope.addressToCheckTokenBalanceResult = $scope.addressToCheckTokenBalance;
                                $scope.checkBalanceWorking = false;
                                $scope.showCheckBalanceResult = true;
                                $scope.$apply(); // <<< needed
                                $log.log('$scope.checkBalanceResult for ', $scope.addressToCheckTokenBalance, " : ", $scope.balance);
                            }
                        ).catch(function (error) {
                            $log.error(error);
                            $scope.checkBalance = error;
                            $scope.checkBalanceWorking = false;
                        });
                    };

                    $scope.transferValue = 0;
                    $scope.transfer = function () {
                        if ($rootScope.stringIsNullUndefinedOrEmpty($scope.transferTo)) {
                            return;
                        }
                        $scope.transferWorking = true;
                        var txOptions = {};
                        txOptions.gasPrice = 10 * 1000000000; // Gwei like in MetaMask
                        $scope.contract.transfer($scope.transferTo, $scope.transferValue, txOptions)
                            .then(function (result) {
                                // see: http://truffleframework.com/docs/getting_started/contracts#processing-transaction-results
                                $log.debug(result);
                                $scope.transferWorking = false;
                                $scope.transferTxHash = result.tx;
                                $scope.refresh();
                            })
                            .catch(function (error) {
                                $log.debug(error);
                                $scope.transferError = error;
                                $scope.transferWorking = false;
                                $scope.$apply();
                            })
                    };

                    $scope.refresh = function () {
                        $scope.refreshContractEthBalance();
                        $scope.getTotalSupply();
                        $scope.getEthBalanceOfDefaultAccount();
                        $scope.getBalanceOfUser();
                    };

                    $scope.init = function () {
                        $scope.getDecimals();
                        $scope.getSymbol();
                        $scope.refresh();
                    };
                    $scope.init();

                    /* --------- ////////////////////////////// contract functions: <<<  */

                    /* ------------- EVENTS: */
                    // for MetaMask see:
                    // https://github.com/MetaMask/metamask-plugin/issues/503
                    $scope.events = [];
                    $scope.showEvents = false;
                    var events = $scope.contract.allEvents(
                        {fromBlock: $rootScope.contractDeployedOnBlock, toBlock: 'latest'}
                    );
                    $log.debug('events:');
                    $log.debug(events);

                    $scope.maxEventsNumber = 100;//
                    events.watch(
                        function (error, result) {
                            if (error) {
                                $log.error(error);
                            } else if (result) {

                                $log.debug('event:');
                                $log.debug(result);

                                if ($scope.maxEventsNumber && $scope.events.length > $scope.maxEventsNumber) {
                                    $scope.allEvents.shift();
                                }
                                $scope.events.push(result);
                                $scope.refresh(); // (!) refresh on any event
                            }
                        }
                    ); // end of events.watch

                }); // end of truffleContract

        }); // end of $.getJSON(truffleArtifactPath

    } // end function homeCtl})();
]);
