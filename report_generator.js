const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generatePDFReport(data) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const today = new Date().toISOString().slice(0, 10);
    const lg = data.lg;
    const samsung = data.samsung;

    const getBase64Image = (p) => {
        try {
            if (p && fs.existsSync(p)) {
                const bitmap = fs.readFileSync(p);
                return `data:image/png;base64,${bitmap.toString('base64')}`;
            }
        } catch (e) { console.error(e); }
        return null;
    };

    const generatePromoSection = (companyName, promotions, badgeClass) => {
        return promotions.map(p => {
            const imgData = getBase64Image(p.screenshot);
            return `
            <div class="promo-item">
                <div class="promo-img">
                   ${imgData ? `<img src="${imgData}" />` : '<div style="padding:20px; background:#eee;">이미지 없음</div>'}
                </div>
                <div class="promo-content">
                    <div class="promo-badge ${badgeClass}">${companyName}</div>
                    <div class="promo-title">${p.title || '제목 없음'}</div>
                    <div class="promo-desc">${p.description || '상세 내용 없음'}</div>
                </div>
            </div>
            `;
        }).join('');
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Apple SD Gothic Neo', sans-serif; padding: 40px; color: #333; max-width: 1200px; margin: 0 auto; background: #fff; }
            h1 { color: #111; border-bottom: 4px solid #111; padding-bottom: 20px; margin-bottom: 40px; }
            h2 { font-size: 1.5em; margin-top: 50px; margin-bottom: 20px; font-weight: 800; border-left: 6px solid #333; padding-left: 15px; }
            
            .comparison-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .comparison-table th { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; font-weight: bold; text-align: center; }
            .comparison-table td { border: 1px solid #ddd; padding: 15px; vertical-align: top; }
            
            .promo-container { display: flex; flex-direction: column; gap: 30px; }
            .promo-item { display: flex; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .promo-img { width: 300px; min-width: 300px; background: #f4f4f4; display: flex; align-items: center; justify-content: center; overflow: hidden;}
            .promo-img img { width: 100%; height: auto; object-fit: cover; }
            .promo-content { padding: 25px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
            .promo-badge { display: inline-block; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 4px; color: #fff; margin-bottom: 10px; width: fit-content; }
            .promo-badge.lg { background-color: #A50034; }
            .promo-badge.samsung { background-color: #1428A0; }
            .promo-title { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; color: #222; }
            .promo-desc { color: #666; line-height: 1.6; font-size: 0.95em; }

            .strategy-box { background: #e3f2fd; padding: 30px; border-radius: 12px; border: 1px solid #bbdefb; }
            .strategy-title { color: #0d47a1; font-weight: bold; font-size: 1.2em; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <h1>📊 구독 서비스 마케팅 심층 분석 (${today})</h1>
        
        <h2>1. 양사 마케팅 혜택 비교 요약</h2>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th width="50%">LG 케어솔루션</th>
                    <th width="50%">삼성 AI 구독</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <ul style="padding-left: 20px;">
                            <li><strong>핵심 소구점:</strong> "최대 혜택가", "0원", "반값 할인" 등 직관적 가격 혜택</li>
                            <li><strong>주요 타겟:</strong> 가격 민감층, 교체 수요(보상판매) 고객</li>
                            <li><strong>이벤트 유형:</strong> <br> - 결합 할인(다품목)<br> - 포인트 적립(첫 구독)<br> - 제휴카드 할인 극대화 표기</li>
                        </ul>
                    </td>
                    <td>
                        <ul style="padding-left: 20px;">
                            <li><strong>핵심 소구점:</strong> "AI 라이프", "알아서 맞춰주는", "패키지"</li>
                            <li><strong>주요 타겟:</strong> 신혼부부, 이사 고객, 스마트홈 선호층</li>
                            <li><strong>이벤트 유형:</strong> <br> - 패키지 구매 시 포인트 N배<br> - 사은품 증정(굿즈, 커피 등)<br> - 체험단/무료체험 기회</li>
                        </ul>
                    </td>
                </tr>
                <tr>
                    <td align="center" style="background:#fff5f7; color:#A50034; font-weight:bold;">
                        마케팅 강도: 매우 강함 (가격 소구 집중)
                    </td>
                    <td align="center" style="background:#e8eaf6; color:#1428A0; font-weight:bold;">
                        마케팅 강도: 보통 (가치/기능 소구 집중)
                    </td>
                </tr>
            </tbody>
        </table>

        <h2>2. [LG전자] 상세 프로모션 분석</h2>
        <div class="promo-container">
            ${generatePromoSection('LG Care Solution', lg.promotions, 'lg')}
        </div>

        <h2>3. [삼성전자] 상세 프로모션 분석</h2>
        <div class="promo-container">
            ${generatePromoSection('Samsung AI Subs', samsung.promotions, 'samsung')}
        </div>

        <h2>4. 정수기 제품 리스트 비교</h2>
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
                        ${lg.products.slice(0, 5).map(p => `<div style="padding:5px 0;"><strong>${p.name}</strong><br><span style="color:#A50034">${p.price}</span></div>`).join('<hr style="margin:5px 0; border:0; border-top:1px dashed #ddd;">')}
                    </td>
                    <td valign="top">
                        ${samsung.products.slice(0, 5).map(p => `<div style="padding:5px 0;"><strong>${p.name}</strong><br><span style="color:#1428A0">${p.price}</span></div>`).join('<hr style="margin:5px 0; border:0; border-top:1px dashed #ddd;">')}
                    </td>
                </tr>
            </tbody>
        </table>

         <h2>5. 💡 2월 구독 전략 제안</h2>
         <div class="strategy-box">
            <div class="strategy-title">🚀 Action Item: "가격의 벽을 넘는 가치 제안"</div>
            <p>1. <strong>[방어]</strong> LG의 '0원' 공세에 맞서, 삼성은 단순 월 요금이 아닌 <strong>"3년 총비용(TCO) 비교"</strong> 배너를 띄워야 합니다. (필터 교체 비용 포함 시 삼성의 경쟁력 부각)</p>
            <p>2. <strong>[공격]</strong> '이벤트 상세' 분석 결과, 경쟁사는 이미지를 단순하게 쓰는 반면 삼성은 감성적인 라이프스타일 컷을 사용합니다. 이를 활용해 <strong>"정수기도 인테리어다"</strong> 캠페인을 강화, 디자인 중시 고객을 뺏어와야 합니다.</p>
         </div>

         <p style="text-align:right; margin-top:50px; color:#999;">Generated by Automated Intelligence System</p>
    </body>
    </html>
    `;

    const reportPath = path.join(__dirname, 'reports', `Competitor_Analysis_Report_Deep_${today}.pdf`);
    await page.setContent(htmlContent);
    await page.pdf({ path: reportPath, format: 'A4', printBackground: true, margin: { top: '40px', bottom: '40px', left: '40px', right: '40px' } });

    await browser.close();
    console.log(`Deep Analysis Report generated: ${reportPath}`);
}

module.exports = generatePDFReport;
