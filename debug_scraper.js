const { chromium } = require('playwright');
const fs = require('fs');

async function debug() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        // LG Debug
        console.log('--- LG Debug ---');
        await page.goto('https://www.lge.co.kr/care-solutions/water-purifiers');
        await page.waitForTimeout(5000); // Wait for load

        // Find an element containing "오브제컬렉션" (common product name part)
        console.log('Searching for LG products...');
        const lgProduct = await page.getByText('오브제컬렉션').first();
        if (await lgProduct.isVisible()) {
            // Get the parent class names to identify the card container
            const parentClasses = await lgProduct.evaluate(el => {
                let p = el.parentElement;
                const classes = [];
                while (p && classes.length < 5) {
                    classes.push(`${p.tagName.toLowerCase()}.${Array.from(p.classList).join('.')}`);
                    p = p.parentElement;
                }
                return classes;
            });
            console.log('LG Product Parent Chain:', parentClasses);
        } else {
            console.log('LG Product text not found. Dumping body text sample...');
            const text = await page.textContent('body');
            console.log(text.substring(0, 500));
        }

        // Samsung Debug
        console.log('--- Samsung Debug ---');
        await page.goto('https://www.samsung.com/sec/ai-subs-kitchen/all-ai-subs-kitchen/');
        await page.waitForTimeout(5000);

        console.log('Searching for Samsung products...');
        // Samsung often loads lazily or requires clicking tabs.
        // Let's check for "Bespoke 정수기"
        const smProduct = await page.getByText('정수기').first();
        if (await smProduct.isVisible()) {
            const parentClasses = await smProduct.evaluate(el => {
                let p = el.parentElement;
                const classes = [];
                while (p && classes.length < 5) {
                    classes.push(`${p.tagName.toLowerCase()}.${Array.from(p.classList).join('.')}`);
                    p = p.parentElement;
                }
                return classes;
            });
            console.log('Samsung Product Parent Chain:', parentClasses);
        } else {
            console.log('Samsung Product text not found. Maybe need to click tab?');
            // Try clicking the tab if possible.
            // Based on previous subagent: "Clicking the 'Water Purifier' tab" was Step 27
            // Selector was likely text based or pixel based.
            // Let's try locating the tap by text "정수기" in a list context
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

debug();
