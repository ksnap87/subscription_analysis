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

    // Generate PDF Report
    const generatePDFReport = require('./report_generator');
    console.log('Generating PDF Report...');
    await generatePDFReport({
        lg: lgData,
        samsung: samsungData
    });

    console.log('All tasks completed successfully.');
}

main();
