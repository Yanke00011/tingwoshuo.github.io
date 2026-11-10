import sharp from 'sharp';
const mark = await sharp('public/brand/mark.svg').png().toBuffer();
await sharp(mark).resize(180,180).png().toFile('public/apple-touch-icon.png');
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f7f7f4"/><circle cx="946" cy="198" r="230" fill="#e8eee9"/><circle cx="946" cy="198" r="168" fill="none" stroke="#d7e1d9"/><image href="data:image/png;base64,${mark.toString('base64')}" x="130" y="172" width="96" height="96"/><text x="130" y="338" fill="#20211f" font-family="sans-serif" font-size="68" font-weight="700">听我说</text><text x="134" y="385" fill="#777a75" font-family="sans-serif" font-size="19" letter-spacing="5">HEAR ME OUT</text><text x="132" y="472" fill="#557566" font-family="sans-serif" font-size="25">关于生活、技术，以及那些值得记录的瞬间。</text></svg>`);
await sharp(svg).png().toFile('public/og.png');
