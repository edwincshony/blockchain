const contractAddress = "0x3eb7098B135eaDeEf628331a3Bb0977495716B87";
const contractABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_name", "type": "string" },
            { "internalType": "string", "name": "_location", "type": "string" },
            { "internalType": "uint256", "name": "_pricePerMonth", "type": "uint256" }
        ],
        "name": "listProperty",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "_propertyId", "type": "uint256" },
            { "internalType": "uint256", "name": "_months", "type": "uint256" }
        ],
        "name": "rentProperty",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
    // Removed getProperties since it’s not working
];

let web3;
let contract;
let account;

async function connectWallet() {
    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const accounts = await web3.eth.getAccounts();
            account = accounts[0];
            
            document.getElementById("account").innerText = account;
            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            alert("Wallet connected successfully!");
            document.getElementById("message").innerText = "Wallet connected. List a property to get started.";
        } catch (error) {
            console.error("Wallet connection failed:", error);
            alert("Error connecting wallet. Check console for details.");
        }
    } else {
        alert("MetaMask is not installed. Please install MetaMask to use this DApp.");
    }
}

async function listProperty() {
    const name = document.getElementById("propertyName").value.trim();
    const location = document.getElementById("propertyLocation").value.trim();
    const price = document.getElementById("propertyPrice").value.trim();

    if (!account) {
        alert("Please connect wallet first!");
        return;
    }

    if (!name || !location || !price || isNaN(price) || Number(price) <= 0) {
        alert("Please enter valid property details.");
        return;
    }

    const priceInWei = web3.utils.toWei(price.toString(), "ether");

    try {
        const gasEstimate = await contract.methods.listProperty(name, location, priceInWei)
            .estimateGas({ from: account });

        const gasPrice = await web3.eth.getGasPrice();
        const gasFeeWei = BigInt(gasEstimate) * BigInt(gasPrice);
        const gasFeeETH = web3.utils.fromWei(gasFeeWei.toString(), "ether");

        document.getElementById("gasEstimate").innerText = gasEstimate;
        document.getElementById("gasFee").innerText = gasFeeETH;

        const confirmTransaction = confirm(
            `Estimated Gas: ${gasEstimate}\nGas Fee: ${gasFeeETH} SepoliaETH\nProceed?`
        );

        if (!confirmTransaction) {
            alert("Transaction cancelled.");
            return;
        }

        await contract.methods.listProperty(name, location, priceInWei)
            .send({ from: account, gas: gasEstimate });

        alert("Property listed successfully!");
        document.getElementById("message").innerText = `Property listed. Use ID ${await getPropertyCount() - 1} to rent.`;
    } catch (error) {
        console.error("Error listing property:", error);
        alert("Error listing property. Check console for details.");
    }
}

async function rentProperty() {
    const propertyId = document.getElementById("propertyId").value.trim();
    const months = document.getElementById("rentalMonths").value.trim();

    if (!account) {
        alert("Please connect wallet first!");
        return;
    }

    if (!propertyId || isNaN(propertyId) || Number(propertyId) < 0 || isNaN(months) || Number(months) <= 0) {
        alert("Enter valid rental details (Property ID and months must be positive numbers).");
        return;
    }

    try {
        // Placeholder: Ideally, we'd fetch the price here, but without getProperties, we assume user knows it
        const assumedPricePerMonthETH = prompt("Enter price per month (ETH) for Property ID " + propertyId + " (since getProperties is unavailable):");
        if (!assumedPricePerMonthETH || isNaN(assumedPricePerMonthETH) || Number(assumedPricePerMonthETH) <= 0) {
            alert("Invalid price entered.");
            return;
        }

        const pricePerMonthWei = web3.utils.toWei(assumedPricePerMonthETH, "ether");
        const totalAmountWei = BigInt(pricePerMonthWei) * BigInt(months);
        const totalAmountETH = web3.utils.fromWei(totalAmountWei.toString(), "ether");

        const gasEstimate = await contract.methods.rentProperty(propertyId, months)
            .estimateGas({ from: account, value: totalAmountWei });

        const gasPrice = await web3.eth.getGasPrice();
        const gasFeeWei = BigInt(gasEstimate) * BigInt(gasPrice);
        const gasFeeETH = web3.utils.fromWei(gasFeeWei.toString(), "ether");

        document.getElementById("gasEstimate").innerText = gasEstimate;
        document.getElementById("gasFee").innerText = gasFeeETH;
        document.getElementById("totalRent").innerText = totalAmountETH;

        const confirmTransaction = confirm(
            `Total Rent: ${totalAmountETH} SepoliaETH\nGas Fee: ${gasFeeETH} SepoliaETH\nProceed?`
        );

        if (!confirmTransaction) return;

        await contract.methods.rentProperty(propertyId, months)
            .send({ from: account, value: totalAmountWei, gas: gasEstimate });

        alert("Property rented successfully!");
        document.getElementById("message").innerText = "Property rented successfully.";
    } catch (error) {
        console.error("Error renting property:", error);
        alert("Error renting property. Check console for details.");
    }
}

async function getPropertyCount() {
    // This is a placeholder; ideally, your contract should have a property count variable or function
    // For now, we'll return a dummy value since we can't fetch properties
    return 1; // Adjust based on your testing
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectWallet").addEventListener("click", connectWallet);
    document.getElementById("listProperty").addEventListener("click", listProperty);
    document.getElementById("rentProperty").addEventListener("click", rentProperty);
});