const { chromium } = require('playwright');

async function scrapeSamsung() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Starting Samsung Scraper...');
    const data = {
        timestamp: new Date().toISOString(),
        site: 'Samsung AI Subscription',
        promotions: [],
        products: []
    };

    try {
        // --- PROMOTIONS ---
        await page.goto('https://www.samsung.com/sec/ai-subs/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // Capture Promo Screenshot
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const promoShotPath = `reports/screenshots/samsung_promo_${dateStr}.png`;
        await page.screenshot({ path: promoShotPath, fullPage: false });
        data.screenshot_promo = promoShotPath;

        // Grab existing promo data which seemed to work partially
        const promotions = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('.swiper-slide, .card').forEach(el => {
                const title = el.querySelector('.tit, .title')?.innerText?.trim();
                if (title) items.push({ title });
            });
            return items;
        });

        // De-duplicate
        data.promotions = [...new Set(promotions.map(p => p.title))].map(t => ({ title: t }));

        // --- PRODUCTS ---
        console.log('Navigating to Samsung Kitchen Subs...');
        await page.goto('https://www.samsung.com/sec/ai-subs-kitchen/all-ai-subs-kitchen/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);

        // Click "Water Purifier" tab
        // Based on Debug, it's a list item with text inside
        try {
            console.log('Looking for Water Purifier tab...');
            // Find tab with text "정수기"
            const tabButton = page.locator('.pf-s-nav-item', { hasText: '정수기' });
            if (await tabButton.count() > 0) {
                await tabButton.first().click();
                console.log('Clicked "정수기" tab.');
                await page.waitForTimeout(3000); // Wait for filter to apply
            } else {
                console.log('Tab not found, proceeding with default view.');
            }
        } catch (e) {
            console.log('Tab click failed:', e.message);
        }

        // Wait for product cards
        await page.waitForSelector('.pf-product-card, .product-card, [class*="product-card"]', { timeout: 5000 }).catch(() => console.log('No cards selector found'));

        // Product List Screenshot
        const productShotPath = `reports/screenshots/samsung_product_${dateStr}.png`;
        await page.screenshot({ path: productShotPath, fullPage: false });
        data.screenshot_product = productShotPath;

        const products = await page.evaluate(() => {
            const items = [];
            // Samsung product cards
            // Inspecting common class names for Samsung: pf-product-card, card-product
            const cards = document.querySelectorAll('[class*="product-card"], [class*="ProductCard"]');

            cards.forEach(card => {
                const name = card.querySelector('.name, .tit, .product-name')?.innerText?.trim() || '';
                // Price strings
                const priceDiv = card.querySelector('[class*="price"]');
                const price = priceDiv ? priceDiv.innerText.replace(/\n/g, ' ').trim() : '';

                if (name && name.includes('정수기')) {
                    items.push({
                        name,
                        price
                    });
                }
            });
            return items;
        });

        console.log(`Samsung: Found ${products.length} products.`);
        data.products = products;

    } catch (error) {
        console.error('Error scraping Samsung:', error);
    } finally {
        await browser.close();
    }

    return data;
}

module.exports = scrapeSamsung;
