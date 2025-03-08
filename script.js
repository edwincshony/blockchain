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

// Connect Wallet
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
            
            alert("✅ Wallet connected successfully!");
        } catch (error) {
            console.error("❌ Wallet connection failed:", error);
            alert("Error connecting wallet.");
        }
    } else {
        alert("⚠️ MetaMask is not installed.");
    }
}

// List Property
async function listProperty() {
    const name = document.getElementById("propertyName").value.trim();
    const location = document.getElementById("propertyLocation").value.trim();
    const price = "0.000000000000000001"; // Fixed price in ETH

    if (!account) return alert("⚠️ Please connect wallet first!");
    if (!name || !location) return alert("⚠️ Enter valid property name and location.");

    const priceInWei = web3.utils.toWei(price, "ether");

    try {
        await contract.methods.listProperty(name, location, priceInWei).send({ from: account });

        let properties = JSON.parse(localStorage.getItem("properties")) || [];
        const propertyId = properties.length;

        properties.push({ id: propertyId, name, location, pricePerMonth: price });
        localStorage.setItem("properties", JSON.stringify(properties));

        alert(`✅ Property listed successfully! ID: ${propertyId}`);
        document.getElementById("message").innerText = `Property listed. Use ID ${propertyId} to rent.`;
    } catch (error) {
        console.error("❌ Error listing property:", error);
        alert("Error listing property.");
    }
}

// Rent Property
async function rentProperty() {
    const propertyId = parseInt(document.getElementById("propertyId").value.trim(), 10);
    const months = parseInt(document.getElementById("rentalMonths").value.trim(), 10);

    if (!account) return alert("⚠️ Please connect wallet first!");
    if (isNaN(propertyId) || propertyId < 0 || isNaN(months) || months <= 0) return alert("⚠️ Enter valid rental details.");

    let properties = JSON.parse(localStorage.getItem("properties")) || [];
    const property = properties.find(p => p.id === propertyId);

    if (!property) return alert(`⚠️ Invalid Property ID: ${propertyId}. Please check the listing.`);

    try {
        const pricePerMonthWei = web3.utils.toWei(property.pricePerMonth, "ether");
        const totalAmountWei = (BigInt(pricePerMonthWei) * BigInt(months)).toString();

        await contract.methods.rentProperty(propertyId, months).send({ from: account, value: totalAmountWei });

        alert(`✅ Property ID ${propertyId} rented for ${months} months.`);
        document.getElementById("message").innerText = `Property ID ${propertyId} rented for ${months} months.`;
    } catch (error) {
        console.error("❌ Error renting property:", error);
        alert("Error renting property.");
    }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectWallet").addEventListener("click", connectWallet);
    document.getElementById("listProperty").addEventListener("click", listProperty);
    document.getElementById("rentProperty").addEventListener("click", rentProperty);
});
