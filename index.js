const scrapeLG = require('./scrapers/lg_scraper');
const scrapeSamsung = require('./scrapers/samsung_scraper');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('Starting Subscription Analysis Automation...');

    // Run scrapers in parallel
    console.log('Scraping data...');
    const [lgData, samsungData] = await Promise.all([
        scrapeLG(),
        scrapeSamsung()
    ]);

    // Save raw data
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    fs.writeFileSync(path.join(dataDir, `competitor_data_${today}.json`), JSON.stringify({
        lg: lgData,
        samsung: samsungData
    }, null, 2));

    console.log('Data collection complete. Saved to data/ directory.');

    // Basic Analysis (Placeholder for now, will expand based on data shape)
    console.log('LG Promotions:', lgData.promotions.length);
    console.log('LG Products:', lgData.products.length);
    console.log('Samsung Promotions:', samsungData.promotions.length);
    console.log('Samsung Products:', samsungData.products.length);
}

main();
