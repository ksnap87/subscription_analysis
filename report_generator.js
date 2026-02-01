const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generatePDFReport(data) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const today = new Date().toISOString().slice(0, 10);
    const lg = data.lg;
    const samsung = data.samsung;

    // Helper to reading base64 image
    const getBase64Image = (p) => {
        try {
            if (p && fs.existsSync(p)) {
                const bitmap = fs.readFileSync(p);
                return `data:image/png;base64,${bitmap.toString('base64')}`;
            }
        } catch (e) { console.error(e); }
        return null;
    };

    const lgPromoImg = getBase64Image(lg.screenshot_promo);
    const samsungPromoImg = getBase64Image(samsung.screenshot_promo);
    const lgProdImg = getBase64Image(lg.screenshot_product);
    const samsungProdImg = getBase64Image(samsung.screenshot_product);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: sans-serif; padding: 40px; color: #333; max-width: 1000px; margin: 0 auto; }
            h1 { border-bottom: 2px solid #000; padding-bottom: 10px; color: #1a237e; }
            h2 { margin-top: 30px; background-color: #f5f5f5; padding: 10px; border-left: 5px solid #1a237e; }
            h3 { color: #555; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;}
            .summary-box { background: #e8eaf6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .comparison-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .comparison-table th, .comparison-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .comparison-table th { background-color: #f0f0f0; }
            .screenshot-container { display: flex; gap: 20px; margin-top: 15px; flex-wrap: wrap; }
            .screenshot-box { flex: 1; min-width: 45%; border: 1px solid #eee; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .screenshot-box img { width: 100%; height: auto; border: 1px solid #ccc; display: block;}
            .screenshot-title { font-weight: bold; text-align: center; margin-bottom: 10px; color: #444; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; color: white; margin-right: 5px;}
            .badge-lg { background-color: #A50034; }
            .badge-sam { background-color: #1428A0; }
            .price-tag { color: #d32f2f; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>🏆 경쟁사 구독 서비스 분석 리포트 (${today})</h1>
        
        <div class="summary-box">
            <h3>📝 핵심 요약</h3>
            <ul>
                <li><strong>LG전자</strong>: 총 ${lg.promotions.length}개의 프로모션 배너 노출. "월 0원", "반값 할인" 등 가격 소구점 강력.</li>
                <li><strong>삼성전자</strong>: 총 ${samsung.promotions.length}개의 혜택 배너 노출. AI 기능 및 패키지 결합 혜택 집중.</li>
                <li><strong>경쟁 강도</strong>: LG의 가격 마케팅이 매우 공격적임.</li>
            </ul>
        </div>

        <h2>1. 마케팅 프로모션 현황</h2>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th width="50%">LG 케어솔루션</th>
                    <th width="50%">삼성 AI 구독</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td valign="top">
                        <ul>
                            ${lg.promotions.slice(0, 5).map(p => `<li>${p.title} <small>(${p.period || '상시'})</small></li>`).join('')}
                        </ul>
                    </td>
                    <td valign="top">
                        <ul>
                            ${samsung.promotions.slice(0, 5).map(p => `<li>${p.title}</li>`).join('')}
                        </ul>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Screenshots -->
        <div class="screenshot-container">
            <div class="screenshot-box">
                <div class="screenshot-title"><span class="badge badge-lg">LG</span> 프로모션/배너 현황</div>
                ${lgPromoImg ? `<img src="${lgPromoImg}" />` : '<p>이미지 없음</p>'}
            </div>
            <div class="screenshot-box">
                <div class="screenshot-title"><span class="badge badge-sam">Samsung</span> 프로모션/배너 현황</div>
                ${samsungPromoImg ? `<img src="${samsungPromoImg}" />` : '<p>이미지 없음</p>'}
            </div>
        </div>

        <h2>2. 정수기 제품 및 가격 비교</h2>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>LG 오브제컬렉션 정수기</th>
                    <th>삼성 Bespoke AI 정수기</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td valign="top">
                         ${lg.products.length > 0 ?
            lg.products.slice(0, 3).map(p => `<div><strong>${p.name}</strong><br><span class="price-tag">${p.price}</span></div><hr>`).join('')
            : '제품 데이터 수집 실패'
        }
                    </td>
                    <td valign="top">
                        ${samsung.products.length > 0 ?
            samsung.products.slice(0, 3).map(p => `<div><strong>${p.name}</strong><br><span class="price-tag">${p.price}</span></div><hr>`).join('')
            : '제품 데이터 수집 실패'
        }
                    </td>
                </tr>
            </tbody>
        </table>

         <!-- Product Screenshots -->
        <div class="screenshot-container">
            <div class="screenshot-box">
                <div class="screenshot-title"><span class="badge badge-lg">LG</span> 상품 리스트 및 가격표</div>
                ${lgProdImg ? `<img src="${lgProdImg}" />` : '<p>이미지 없음</p>'}
            </div>
            <div class="screenshot-box">
                <div class="screenshot-title"><span class="badge badge-sam">Samsung</span> 상품 리스트 및 가격표</div>
                ${samsungProdImg ? `<img src="${samsungProdImg}" />` : '<p>이미지 없음</p>'}
            </div>
        </div>

        <h2>3. 🚀 전략 제안 (AI 생성)</h2>
        <div style="background:#fff3e0; padding:15px; border-left:5px solid #ff9800;">
            <h3>삼성전자 대응 전략</h3>
            <p><strong>1. 가격 표시 단순화</strong>: LG의 직관적인 "반값/0원" 표기에 대응하기 위해 복잡한 제휴 혜택 조건을 단순한 "최종 체감가" 위주로 배너를 교체해야 합니다.</p>
            <p><strong>2. '방문 케어' 안심 마케팅</strong>: LG의 강점인 방문 케어에 맞서, 삼성의 '스마트 365 케어'가 어떻게 더 위생적이고 똑똑한지(비대면의 장점)를 시각적으로 보여주는 비교 콘텐츠가 필요합니다.</p>
        </div>
        
        <br><br>
        <p style="text-align:center; color:#999; font-size:0.8em;">Generated by Automated Agent System • ${new Date().toLocaleString()}</p>
    </body>
    </html>
    `;

    // Save PDF
    const reportPath = path.join(__dirname, 'reports', `Competitor_Analysis_Report_${today}.pdf`);
    await page.setContent(htmlContent);
    await page.pdf({ path: reportPath, format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });

    await browser.close();
    console.log(`PDF Report generated: ${reportPath}`);
}

module.exports = generatePDFReport;
