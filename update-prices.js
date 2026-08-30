const fs = require('fs');
const axios = require('axios');

async function run() {
  try {
    const raw = fs.readFileSync('products.json', 'utf8');
    const products = JSON.parse(raw);
    let updated = 0;

    for (const prod of products) {
      if (!prod.affiliateUrl) continue;
      try {
        const resp = await axios.get(prod.affiliateUrl, {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const html = resp.data || '';
        let foundPrice = null;

        const coupang = html.match(/class=["'][^"']*total-price[^"']*["'][^>]*>[\s\S]*?<strong>([\d,]+)<\/strong>/i) ||
                        html.match(/class=["'][^"']*price-value[^"']*["'][^>]*>([\d,]+)/i);
        if (coupang && coupang[1]) foundPrice = coupang[1].trim();

        if (!foundPrice) {
          const naver = html.match(/class=["'][^"']*_1LY7DqCnwR[^"']*["'][^>]*>([\d,]+)/i) ||
                        html.match(/class=["'][^"']*price_num[^"']*["'][^>]*>([\d,]+)/i);
          if (naver && naver[1]) foundPrice = naver[1].trim();
        }

        if (foundPrice) {
          prod.price = foundPrice;
          const orig = parseInt((prod.originalPrice || '0').replace(/[^0-9]/g, ''), 10);
          const pr = parseInt(foundPrice.replace(/[^0-9]/g, ''), 10);
          if (orig && pr && orig > pr) {
            prod.discount = Math.round(((orig - pr) / orig) * 100) + '%';
          }
          updated++;
        }
      } catch (e) {}
      prod.updatedAt = new Date().toISOString().split('T')[0];
    }

    fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
    console.log([완료]  + products.length + 개 중  + updated + 개 최신 가격 갱신);
  } catch (err) {
    console.error(err);
  }
}
run();