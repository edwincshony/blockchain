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
];

let web3, contract, account;

async function connectWallet() {
    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const accounts = await web3.eth.getAccounts();
            account = accounts[0];

            document.getElementById("account").innerText = account;
            document.getElementById("account").classList.add("text-success");

            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            alert("Wallet connected successfully!");
        } catch (error) {
            console.error("Wallet connection failed:", error);
            alert("Error connecting wallet.");
        }
    } else {
        alert("MetaMask is not installed.");
    }
}

async function listProperty() {
    const name = document.getElementById("propertyName").value.trim();
    const location = document.getElementById("propertyLocation").value.trim();
    const price = document.getElementById("propertyPrice").value.trim();

    if (!account) return alert("Please connect wallet first!");
    if (!name || !location || !price || isNaN(price) || Number(price) <= 0) return alert("Enter valid property details.");

    const priceInWei = web3.utils.toWei(price.toString(), "ether");

    try {
        const gasEstimate = await contract.methods.listProperty(name, location, priceInWei).estimateGas({ from: account });
        await contract.methods.listProperty(name, location, priceInWei).send({ from: account, gas: gasEstimate });

        // Ensure property data is stored
        let properties = JSON.parse(localStorage.getItem("properties")) || [];
        const propertyId = properties.length;

        properties.push({ id: propertyId, name, location, pricePerMonth: price });
        localStorage.setItem("properties", JSON.stringify(properties));

        alert(`Property listed successfully! ID: ${propertyId}`);
        document.getElementById("message").innerText = `Property listed. Use ID ${propertyId} to rent.`;
    } catch (error) {
        console.error("❌ Error listing property:", error);
        alert("Error listing property.");
    }
}



async function rentProperty() {
    const propertyId = parseInt(document.getElementById("propertyId").value.trim(), 10);
    const months = parseInt(document.getElementById("rentalMonths").value.trim(), 10);

    if (!account) return alert("Please connect wallet first!");
    if (isNaN(propertyId) || propertyId < 0 || isNaN(months) || months <= 0) return alert("Enter valid rental details.");

    let properties = JSON.parse(localStorage.getItem("properties")) || [];
    const property = properties.find(p => p.id === propertyId);

    if (!property) return alert(`Invalid Property ID: ${propertyId}. Please check the listing.`);

    try {
        const pricePerMonthWei = web3.utils.toWei(property.pricePerMonth, "ether");
        const totalAmountWei = BigInt(pricePerMonthWei) * BigInt(months);

        const gasEstimate = await contract.methods.rentProperty(propertyId, months).estimateGas({ from: account, value: totalAmountWei });
        await contract.methods.rentProperty(propertyId, months).send({ from: account, value: totalAmountWei, gas: gasEstimate });

        alert("Property rented successfully!");
        document.getElementById("message").innerText = `Property ID ${propertyId} rented for ${months} months.`;
    } catch (error) {
        console.error("❌ Error renting property:", error);
        alert("Error renting property.");
    }
}



document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectWallet").addEventListener("click", connectWallet);
    document.getElementById("listProperty").addEventListener("click", listProperty);
    document.getElementById("rentProperty").addEventListener("click", rentProperty);
});
