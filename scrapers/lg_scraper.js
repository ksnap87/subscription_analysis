const { chromium } = require('playwright');

async function scrapeLG() {
    const browser = await chromium.launch({ headless: true });
    // Use desktop viewport
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Starting LG Scraper (Deep Dive Mode)...');
    const data = {
        timestamp: new Date().toISOString(),
        site: 'LG Care Solutions',
        promotions: [],
        products: []
    };

    try {
        // --- PROMOTIONS ---
        console.log('Navigating to LG Benefits...');
        await page.goto('https://www.lge.co.kr/benefits', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000); // Visuals load slowly

        // 1. Main Hero Carousel Text (often contains strongest text)
        const heroPromos = await page.evaluate(() => {
            const slides = document.querySelectorAll('.ui_carousel_track .ui_carousel_slide');
            const data = [];
            slides.forEach(slide => {
                const text = slide.innerText.split('\n').filter(t => t.trim().length > 0).join(' ');
                if (text) data.push({ title: text, type: 'Hero' });
            });
            return data;
        });

        // 2. Event Cards (Detailed Capture)
        const promoItems = [];
        const promoCards = await page.$$('.benefit-card-link, .event-card, .list-item'); // Get element handles

        console.log(`LG: Found ${promoCards.length} potential promo cards. Processing top 5...`);

        // Loop through top 5 cards for detailed screenshot & text
        for (let i = 0; i < Math.min(promoCards.length, 5); i++) {
            const card = promoCards[i];
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

            try {
                // Scroll into view
                await card.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500);

                // Extract Text
                const textData = await card.evaluate(el => {
                    const title = el.querySelector('.tit, .title, strong')?.innerText?.trim() ||
                        el.innerText.split('\n')[0];
                    const desc = el.querySelector('.desc, .date, .sub-text')?.innerText?.trim() || '';
                    const link = el.getAttribute('href') || el.querySelector('a')?.getAttribute('href') || '';
                    return { title, desc, link };
                });

                // Capture Screenshot of the element
                const shotPath = `reports/screenshots/lg_promo_${i}_${dateStr}.png`;
                await card.screenshot({ path: shotPath });

                promoItems.push({
                    title: textData.title,
                    description: textData.desc,
                    link: textData.link,
                    screenshot: shotPath
                });

            } catch (e) {
                console.log(`LG Promo ${i} capture failed: ${e.message}`);
            }
        }

        data.promotions = promoItems;
        console.log(`LG: Successfully captured ${data.promotions.length} detailed promotions.`);


        // Screenshot Promo
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const promoShotPath = `reports/screenshots/lg_promo_${dateStr}.png`;
        try {
            await page.screenshot({ path: promoShotPath, fullPage: false });
            data.screenshot_promo = promoShotPath;
        } catch (e) { console.log('LG Promo screenshot failed'); }


        // --- PRODUCTS ---
        console.log('Navigating to LG Water Purifiers...');
        await page.goto('https://www.lge.co.kr/care-solutions/water-purifiers', { waitUntil: 'domcontentloaded' });

        // Dynamic Scroll for Lazy Loading
        await page.evaluate(async () => {
            const distance = 500;
            const delay = 400;
            while (document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
                document.scrollingElement.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));
                if (document.scrollingElement.scrollTop > 4000) break; // Limit scroll to avoid infinite
            }
        });
        await page.waitForTimeout(2000);

        // Screenshot Product
        const productShotPath = `reports/screenshots/lg_product_${dateStr}.png`;
        await page.screenshot({ path: productShotPath, fullPage: false });
        data.screenshot_product = productShotPath;

        // Product List Extraction
        const products = await page.evaluate(() => {
            const items = [];
            // Generic product card container
            // Attempt to find containers that have "won" or "price" in them
            const potentialCards = document.querySelectorAll('div, li');

            potentialCards.forEach(card => {
                // Filter: must be a "product card" wrapper. hard to identify classlessly.
                // Use specific keys found in debug: 'maximum_benefit_price'
                const priceEl = card.querySelector('.maximum_benefit_price, .total-price');
                const nameEl = card.querySelector('.name, .tit');

                // Avoid duplicates by checking if THIS card is the direct key holder
                if (priceEl && nameEl) {
                    const name = nameEl.innerText.trim();
                    if (name.includes('정수기')) { // Filter for water purifiers
                        const priceText = priceEl.innerText.replace(/\n/g, '').trim();
                        // Check if we already have this product (simple check)
                        const exists = items.find(i => i.name === name);
                        if (!exists) {
                            items.push({ name, price: priceText });
                        }
                    }
                }
            });
            // Fallback: search for list items with text content patterns if structure fails
            return items.length > 0 ? items : [];
        });

        // If specific logic failed, try a very generic "text dump" fallback for analysis
        if (products.length === 0) {
            console.log('LG: Product specific extraction failed. Attempting generic text search.');
            const textProducts = await page.evaluate(() => {
                const hits = [];
                const elements = document.querySelectorAll('*');
                elements.forEach(el => {
                    const txt = el.innerText || '';
                    if (txt.includes('정수기') && txt.match(/[0-9,]+원/)) {
                        // Very loose match, might get noise, but better than 0
                        if (el.childElementCount === 0 && el.tagName !== 'SCRIPT') { // Leaf nodes
                            hits.push({ name: 'Detected Text', price: txt.substring(0, 50) + '...' });
                        }
                    }
                });
                return hits.slice(0, 5); // Limit noise
            });
            data.products = textProducts;
        } else {
            data.products = products;
        }

        console.log(`LG: Found ${data.products.length} products.`);

    } catch (error) {
        console.error('Error scraping LG:', error);
    } finally {
        await browser.close();
    }

    return data;
}

module.exports = scrapeLG;
