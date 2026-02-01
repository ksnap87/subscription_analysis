const { chromium } = require('playwright');

async function scrapeLG() {
    const browser = await chromium.launch({ headless: true });
    // Use a desktop viewport to ensure standard layout
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Starting LG Scraper...');
    const data = {
        timestamp: new Date().toISOString(),
        site: 'LG Care Solutions',
        promotions: [],
        products: []
    };

    try {
        // --- PROMOTIONS ---
        console.log('Navigating to LG Benefits...');
        await page.goto('https://www.lge.co.kr/benefits', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // Capture Promotion Screenshot
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const promoShotPath = `reports/screenshots/lg_promo_${dateStr}.png`;
        await page.screenshot({ path: promoShotPath, fullPage: false });
        data.screenshot_promo = promoShotPath;

        // Try multiple potential selectors for benefit cards
        const promotionElements = await page.evaluate(() => {
            const items = [];
            // Common wrapper patterns
            const cards = document.querySelectorAll('.board-list-box li, .event_list li, .list-item');

            cards.forEach(card => {
                const title = card.querySelector('.tit, .title, .subject, strong')?.innerText?.trim() || '';
                const date = card.querySelector('.date, .period, .data')?.innerText?.trim() || '';
                const link = card.querySelector('a')?.href || '';

                if (title) {
                    items.push({ title, period: date, link });
                }
            });
            return items;
        });

        // If empty, try fallback to getting any "event" looking links
        if (promotionElements.length === 0) {
            console.log('LG: No promotions found with standard selectors. Trying fallback.');
            // Fallback logic could go here
        }
        data.promotions = promotionElements;


        // --- PRODUCTS ---
        console.log('Navigating to LG Water Purifiers...');
        await page.goto('https://www.lge.co.kr/care-solutions/water-purifiers', { waitUntil: 'domcontentloaded' });

        // Scroll down to trigger lazy load
        await page.evaluate(async () => {
            window.scrollBy(0, 1000);
            await new Promise(r => setTimeout(r, 1000));
            window.scrollBy(0, 1000);
            await new Promise(r => setTimeout(r, 1000));
        });

        // Capture Product Screenshot
        const productShotPath = `reports/screenshots/lg_product_${dateStr}.png`;
        await page.screenshot({ path: productShotPath, fullPage: false });
        data.screenshot_product = productShotPath;

        // LG Product List
        const products = await page.evaluate(() => {
            const items = [];
            // Look for cards with pricing info
            // Strategy: Find elements with specific price classes or patterns
            const cards = document.querySelectorAll('div[class*="item"], li[class*="item"]');

            cards.forEach(card => {
                // Must have a name and a price to be valid
                const nameHelper = card.querySelector('.name, .tit, p[class*="name"]');
                const priceHelper = card.querySelector('.price, .total-price, .monthly-cost');

                // Sometimes price is in a 'strong' tag inside a div

                if (nameHelper && nameHelper.innerText.includes('정수기')) {
                    const name = nameHelper.innerText.trim();
                    const price = priceHelper ? priceHelper.innerText.trim() :
                        (card.innerText.match(/월\s*[\d,]+\s*원/)?.[0] || '가격 정보 없음');

                    // Get specs if available
                    const specs = Array.from(card.querySelectorAll('ul.spec li, .info li')).map(li => li.innerText);

                    items.push({
                        name,
                        price,
                        specs
                    });
                }
            });
            return items;
        });

        console.log(`LG: Found ${products.length} products.`);
        data.products = products;

    } catch (error) {
        console.error('Error scraping LG:', error);
    } finally {
        await browser.close();
    }

    return data;
}

module.exports = scrapeLG;
