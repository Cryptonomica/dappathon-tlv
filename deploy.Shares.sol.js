// run:
// nodejs deploy.LegalEntity.sol.js
// (Ethereum node with unlocked account has to be running):

// parity --chain=kovan --keys-path=${HOME}/.eth.keys/ --unlock=0x0586D1dc9BBE1592B5132ED98f8a7BF2Ed771382 --password=${HOME}/.eth.keys/0x0586D1dc9BBE1592B5132ED98f8a7BF2Ed771382.password
// followed by:
// geth attach ~/.local/share/io.parity.ethereum/jsonrpc.ipc

// before deploy check acc eth balance:
// web3.fromWei(web3.eth.getBalance(eth.accounts[0]), 'ether')
// eth.accounts.forEach(function(acc){console.log(acc, ':', web3.fromWei(web3.eth.getBalance(acc), 'ether'), 'ETH')});

var $sct = require('smart-contract-tools');
$sct.web3.eth.defaultAccount = "0x0586D1dc9BBE1592B5132ED98f8a7BF2Ed771382";
console.log("web3.eth.defaultAccount is set to:", $sct.web3.eth.defaultAccount);

var fs = require("fs");
var solc = require('solc');
var truffleContract = require("truffle-contract");

var pathToFile = "smartcontracts/Shares.sol";
var contractName = "Shares";

var source = fs.readFileSync(pathToFile, 'utf8'); // If the encoding option is specified then this function returns a string. Otherwise it returns a buffer.
console.log("source.length:", source.length);

var compiledContract;

// https://github.com/ethereum/solc-bin/tree/gh-pages/bin
// https://ethereum.github.io/solc-bin/bin/soljson-' + versionString + '.js
// https://ethereum.github.io/solc-bin/bin/soljson-v0.4.20+commit.3155dd80.js
var versionString = "v0.4.25+commit.59dbf8f1";

solc.loadRemoteVersion(versionString, function (error, compiler) {
        if (!error) {
            var compiledContracts;
            try {
                console.log("compiler.version:", compiler.version());
                compiledContracts = compiler.compile(source, 1); // setting 1 as second parameter activates the optimiser
                // compiledContracts = compiler.compile(source, 0); // setting 1 as second parameter activates the optimiser // Error: oversized data
                // console.log(compiledContracts);
            } catch (error) {
                console.log(error);
                return;
            }

            if (compiledContracts.errors) {
                console.log("compiler errors:");
                console.log(compiledContracts.errors);
                // return; // no return here, 'errors' can be just warnings
            }
            var contractNames = Object.keys(compiledContracts.contracts);
            var compiledContract = compiledContracts.contracts[':' + contractName];

            if (compiledContract === undefined) {
                console.log('provided source code does not contain contract named: ', contractName, "(" + contractNames + ")");
                return;
            }

            /// ==================================================================>>
            var abi = compiledContract.interface;
            var contractObject = $sct.web3.eth.contract(JSON.parse(abi));

            var bytecode = '0x' + compiledContract.bytecode; // (!!!) <- needs '0x' prefix

            var gasEstimate = $sct.web3.eth.estimateGas({data: bytecode}); // Error: gas required exceeds allowance or always failing transaction
            console.log('gas estimate:', gasEstimate);

            // lastBlockGasLimit
            const block = $sct.web3.eth.getBlock("latest");
            const lastBlockGasLimit = block.gasLimit;
            console.log("lastBlockGasLimit:", lastBlockGasLimit);

            // https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethcontract
            var contractInstance = contractObject.new(
                {
                    from: $sct.web3.eth.defaultAccount,
                    data: bytecode, // <<< needs "0x" prefix
                    gas: gasEstimate,
                    // gas: lastBlockGasLimit, // TODO: check this
                    gasPrice: 7 * 1000000000, //
                    // gasPrice: 3 * 1000000000, // Gwei like in MetaMask
                    // value: 10000000000000000 / 100
                }
            );

            // the hash of the transaction, which created the contract
            console.log("tx sent to network, tx hash:", contractInstance.transactionHash);

            let transactionReceipt;
            let blockNumber;
            while (true) {
                transactionReceipt = $sct.web3.eth.getTransactionReceipt(contractInstance.transactionHash);
                if (transactionReceipt) {
                    if (transactionReceipt.blockNumber) {
                        blockNumber = transactionReceipt.blockNumber;
                        break;
                    }
                }
            }

            console.log("deployed on block:");
            console.log($sct.currentNetwork.etherscanLinkPrefix + "block/" + blockNumber);
            console.log();
            console.log(transactionReceipt);
            console.log();
            console.log($sct.currentNetwork.etherscanLinkPrefix + "tx/" + contractInstance.transactionHash);

            if (transactionReceipt.status === '0x00' // Ganache
                || transactionReceipt.status === '0x0') { // Geth
                console.log("contract creation transaction failed");
                return;
            }

            /// =================================================================<<

            var contractDeployed = contractInstance;

            if (contractDeployed !== undefined) {

                console.log();
                var timestamp = new Date();
                console.log("timestamp: "
                    + timestamp.toLocaleDateString() + " " + timestamp.toLocaleTimeString()
                );

                // fs.writeFileSync(addressFile, contractDeployed.address);
                // fs.writeFileSync(abiFile, JSON.stringify(contractDeployed.abi));
                // fs.writeFileSync(contractDeployedDataFile, JSON.stringify(contractDeployed));

                var truffleArtifact = truffleContract(
                    {
                        abi: abi,
                        unlinked_binary: bytecode
                    }
                );
                truffleArtifact.setProvider($sct.web3.currentProvider);

                /* ======== write truffle artifact JSON ================ */

                truffleArtifact.networks[$sct.web3.version.network] = {};

                truffleArtifact.networks[$sct.web3.version.network].address =
                    transactionReceipt.contractAddress;
                truffleArtifact.networks[$sct.web3.version.network].deployedOnBlock = blockNumber; // << (!) non standart

                if (fs.existsSync("./webapp/smartcontracts/" + contractName + ".json")) {
                    fs.unlinkSync("./webapp/smartcontracts/" + contractName + ".json");
                }
                fs.writeFileSync("./webapp/smartcontracts/" + contractName + ".json", JSON.stringify(truffleArtifact));

            } else {
                console.log("ERROR: contract was not created");
            }

        } else {
            console.error(error);
        }
    }
);

