"use strict";
const Web3Modal = window.Web3Modal.default;
let web3Modal;
let provider;
let selectedAccount;
let chainId;
const maxSupply = 5000;
let isConnected = false;
const mintPrice = 0.0069;
const free_mintPrice = 0;
let contractAddress = "0x6067Ea8fCB6baEb0c278c2D5Ac139d3ad3283F06";
let infuraUrl = "https://mainnet.infura.io/v3/0bd955d92ca84821a7fcf6207f779870"
let abi = [{
    "inputs": [{
        "internalType": "uint256",
        "name": "tokenQuantity",
        "type": "uint256"
    }],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{
        "internalType": "uint256",
        "name": "tokenQuantity",
        "type": "uint256"
    }],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
}, {
    "inputs": [],
    "name": "claimFreeLive",
    "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "publicLive",
    "outputs": [{
        "internalType": "bool",
        "name": "",
        "type": "bool"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
    }],
    "stateMutability": "view",
    "type": "function"
}];

function init() {


    const providerOptions = {};
    web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions,
        disableInjectedProvider: false,
    });
    checkSupply().then(async s => {
        document.getElementById("connect-quantityAllowed").innerHTML = `Left : <span class="text-white">${(maxSupply - s) + ' / ' + maxSupply}</span><br>Price : <span class="text-white">${mintPrice}</span>`
    })
}
async function fetchAccountData() {
    const web3 = new Web3(provider);
    chainId = await web3.eth.getChainId();
    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
}

async function onConnect() {
    try {
        provider = await web3Modal.connect();
    } catch (e) {
        console.log("Could not get a wallet connection", e);
        return;
    }

    provider.on("accountsChanged", (accounts) => {
        fetchAccountData();
    });

    provider.on("chainChanged", (chainId) => {
        fetchAccountData();
    });

    fetchAccountData();
}

async function checkSupply() {
    const web3 = new Web3(
        new Web3.providers.HttpProvider(
            infuraUrl
        )
    );
    const contract = new web3.eth.Contract(abi, contractAddress);
    return await contract.methods.totalSupply().call();
}


async function publicStatus() {
    const web3 = new Web3(
        new Web3.providers.HttpProvider(
            infuraUrl
        )
    );
    const contract = new web3.eth.Contract(abi, contractAddress);
    return await contract.methods.publicLive().call();
}

async function connect() {
    if (window.web3 == undefined && window.ethereum == undefined) {
        window
            .open("https://metamask.app.link/dapp/digitmfers.com", "_blank")
            .focus();
    }
    provider = await web3Modal.connect();
    provider.on("accountsChanged", (accounts) => {
        fetchAccountData();
    });
    provider.on("chainChanged", (chainId) => {
        fetchAccountData();
    });
    await fetchAccountData();
    const supply = await checkSupply();

    const publicLive = await publicStatus();

    if (!publicLive) {
        document.getElementById("connect-info").innerHTML = "Mint closed";
        iziToast.error({
            title: "Error",
            message: "Mint is not live",
        });
    }
    if (supply >= maxSupply) {
        document.getElementById("connect-info").innerHTML = "Max supply reached";
        iziToast.error({
            title: "Error",
            message: "Max supply reached",
        });
    }

    if (!selectedAccount) {
        document.getElementById("connect-info").innerHTML = "Not connected";
        iziToast.error({
            title: "Error",
            message: "You need to be connected to mint.",
        });
    }
    if (chainId !== 1) {
        document.getElementById("connect-info").innerHTML = "Not ETH mainnet";
        iziToast.error({
            title: "Error",
            message: "Switch to ETH mainnet.",
        });
    }
    document.getElementById("connect-quantityAllowed").innerHTML = `Left : <span class="text-white">${(maxSupply - supply) + ' / ' + maxSupply}</span><br>Price : <span class="text-white">${mintPrice}Ξ</span>`

    if (chainId == 1 && selectedAccount && (publicLive) && supply < maxSupply) {
        document.getElementById("connect-info").innerHTML = "Connected";
        document.getElementById("connect-info").classList.remove("bg-danger");
        document.getElementById("connect-info").classList.add("bg-success");
        document.getElementById("connect-button").innerHTML = "Connected";
        document.getElementById("connect-button").classList.add("btn-outline-dark");
        document.getElementById("connect-button").classList.remove("btn-outline-success");
        isConnected = true;
    } else {
        document.getElementById("connect-info").innerHTML = "Not Connected";
        document.getElementById("connect-info").classList.add("bg-danger");
        document.getElementById("connect-info").classList.remove("bg-sucess");
        document.getElementById("connect-button").innerHTML = "Connect";
        document.getElementById("connect-button").classList.add("btn-outline-sucess");
        document.getElementById("connect-button").classList.remove("btn-outline-dark");
        isConnected = false;
    }

}
async function mint() {
    if (!isConnected) {
        iziToast.error({
            title: "Error",
            message: "No connected",
        });
        return
    }
    const web3 = new Web3(provider);
    const contract = new web3.eth.Contract(abi, contractAddress);


    const publicLive = await publicStatus();
    const supply = await checkSupply();

    if (publicLive) {
        if (supply < 1000) {
            contract.methods

                .mint(document.getElementById("buyQuantityRange").value)
                .send({
                    from: selectedAccount,
                    value: web3.utils.toWei((free_mintPrice).toString(), 'ether') * document.getElementById("buyQuantityRange").value
                }).then(function (info) {
                    iziToast.success({
                        title: 'OK',
                        message: 'Successfully bought!',
                    });
                }).catch(function (err) {

                });
        } else {
            contract.methods

                .mint(document.getElementById("buyQuantityRange").value)
                .send({
                    from: selectedAccount,
                    value: web3.utils.toWei((mintPrice).toString(), 'ether') * document.getElementById("buyQuantityRange").value
                }).then(function (info) {
                    iziToast.success({
                        title: 'OK',
                        message: 'Successfully bought!',
                    });
                }).catch(function (err) {

                });
        }


    }

}
window.addEventListener("load", async () => {
    init();
});