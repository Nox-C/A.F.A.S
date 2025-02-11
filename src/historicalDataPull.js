const fetch = require('node-fetch'); // Ensure you have node-fetch installed
const fs = require('fs'); // File system module to write to files
const config = require('./config');

// Function to fetch historical prices for multiple tokens
async function fetchHistoricalPrices(tokens, startDate, endDate) {
    const url = `${config.MAINNET_HTTP}/v2/${config.API_KEY}/historical/prices?tokens=${tokens.join(',')}&startDate=${startDate}&endDate=${endDate}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.result) {
            console.log('Fetched Historical Prices:', data.result);
            // Save data to CSV
            saveToCSV(data.result);
            return data.result; // Process the data as needed
        } else {
            console.error('Error fetching historical prices:', data);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Function to save data to a CSV file
function saveToCSV(data) {
    const csvRows = [];
    // Create header row
    const headers = 'Token,Price,Date\n';
    csvRows.push(headers);

    // Populate rows
    data.forEach(row => {
        const csvRow = `${row.token},${row.price},${row.date}\n`;
        csvRows.push(csvRow);
    });

    // Write to CSV file
    fs.writeFileSync('historical_prices.csv', csvRows.join(''));
    console.log('Historical prices saved to historical_prices.csv');
}

// Example token list (replace with actual token symbols)
const tokens = ['BNB', 'USDT', 'ETH', 'BTC', 'CAKE', 'BUSD']; // Add more tokens as needed

// Specify the date range for historical data
const startDate = '2020-01-01'; // Start date in YYYY-MM-DD format
const endDate = '2023-01-01'; // End date in YYYY-MM-DD format

// Fetch historical prices
fetchHistoricalPrices(tokens, startDate, endDate).then(() => {
    console.log('Historical data pull completed. Exiting...');
    process.exit(); // Exit the process after the data pull
});
