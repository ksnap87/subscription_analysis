const { chromium } = require('playwright');

async function scrapeSamsung() {
    const browser = await chromium.launch({ headless: true });
    // Samsung needs a large viewport to show all nav items
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log('Starting Samsung Scraper (Deep Dive Mode)...');
    const data = {
        timestamp: new Date().toISOString(),
        site: 'Samsung AI Subscription',
        promotions: [],
        products: []
    };

    try {
        // --- PROMOTIONS ---
        console.log('Opening Samsung AI Subs...');
        await page.goto('https://www.samsung.com/sec/ai-subs/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Try Clicking 'Benefit Collection' Tab if it exists
        try {
            const benefitTab = page.locator('button, a', { hasText: '구독혜택 모음집' }).first();
            if (await benefitTab.isVisible()) {
                await benefitTab.click();
                await page.waitForTimeout(2000);
            }
        } catch (e) { }

        // Capture Promo Screenshot
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const promoShotPath = `reports/screenshots/samsung_promo_${dateStr}.png`;
        try {
            await page.screenshot({ path: promoShotPath, fullPage: false });
            data.screenshot_promo = promoShotPath;
        } catch (e) { }

        // Capture Individual Promo Screenshots
        const promoItems = [];
        // Identify valid promo containers (swiper slides or list items)
        const promoCards = await page.$$('.swiper-slide .card, .benefit-list li, .swiper-slide img');

        console.log(`Samsung: Found ${promoCards.length} potential promo cards. Processing top 5...`);

        for (let i = 0; i < Math.min(promoCards.length, 5); i++) {
            const card = promoCards[i];
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

            try {
                await card.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500);

                const textData = await card.evaluate(el => {
                    // Try to find text context either inside or near the image
                    const container = el.closest('div') || el;
                    const title = container.innerText.split('\n')[0] || 'Image Banner';
                    const desc = container.innerText.replace(title, '').trim().substring(0, 100);
                    return { title, desc };
                });

                const shotPath = `reports/screenshots/samsung_promo_${i}_${dateStr}.png`;
                await card.screenshot({ path: shotPath });

                promoItems.push({
                    title: textData.title,
                    description: textData.desc,
                    screenshot: shotPath
                });

            } catch (e) {
                console.log(`Samsung Promo ${i} capture failed: ${e.message}`);
            }
        }
        data.promotions = promoItems;
        console.log(`Samsung: Successfully captured ${data.promotions.length} detailed promotions.`);

        // --- PRODUCTS ---
        console.log('Navigating to Samsung Kitchen Subs...');
        // Go directly to water purifier query if possible, or main page
        await page.goto('https://www.samsung.com/sec/ai-subs-kitchen/all-ai-subs-kitchen/', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000); // Initial Load

        // Robust Tab Click: "정수기"
        console.log('Filtering for Water Purifiers...');
        let clicked = false;
        try {
            // Locate by text strictly
            const buttons = await page.getByRole('button', { name: '정수기' }).all();
            for (const btn of buttons) {
                if (await btn.isVisible()) {
                    await btn.click();
                    clicked = true;
                    console.log('Clicked Water Purifier tab');
                    break;
                }
            }
            if (!clicked) {
                // Try generic selector
                const tab = page.locator('.pf-s-nav-item', { hasText: '정수기' });
                if (await tab.count() > 0) {
                    await tab.first().click();
                    clicked = true;
                }
            }
        } catch (e) { console.log('Tab Interaction Error:', e.message); }

        await page.waitForTimeout(3000); // Wait for AJAX

        // Scroll
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(1000);

        // Product Screenshot
        const productShotPath = `reports/screenshots/samsung_product_${dateStr}.png`;
        await page.screenshot({ path: productShotPath, fullPage: false });
        data.screenshot_product = productShotPath;

        const products = await page.evaluate(() => {
            const items = [];
            // Target Samsung product cards (pf-product-card)
            const cards = document.querySelectorAll('.pf-product-card, .card-product');

            cards.forEach(card => {
                const name = card.querySelector('.name, .tit, .model-name')?.innerText?.trim();
                // Price is tricky in Samsung, usually "월 X,XXX원"
                const priceBlob = card.innerText;
                const priceMatch = priceBlob.match(/월\s*([0-9,]+)원/);

                if (name && (name.includes('정수기') || name.includes('Bespoke'))) {
                    items.push({
                        name: name,
                        price: priceMatch ? `월 ${priceMatch[1]}원` : '가격 확인 필요'
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
