import { JsonRpcProvider } from 'ethers';
import config from './config'; // Import the config file

// Connect to the BNB Testnet using the API URL from config
const provider = new JsonRpcProvider(config.API_URL);

// Function to get the latest block
async function getLatestBlock() {
    const blockNumber = "latest"; // Fetch the latest block
    const block = await provider.getBlock(blockNumber);
    console.log('Latest Block:', block);
}

// Execute the function
getLatestBlock().catch(error => console.error('Error:', error));
