const fs = require('fs');
const crypto = require('crypto');

// Статистика по большому файлу + много хеш-итераций, чтобы вычисление было долгим
function heavyStats(file, rounds) {
  const text = fs.readFileSync(file, 'utf8');
  const byCategory = {};
  let count = 0;
  let total = 0;
  let digest = '';

  for (const line of text.split('\n')) {
    if (!line) continue;
    const record = JSON.parse(line);

    let hash = record.name;
    for (let i = 0; i < rounds; i++) {
      hash = crypto.createHash('sha256').update(hash).digest('hex');
    }
    digest = hash;

    count++;
    total += record.price;
    byCategory[record.category] = (byCategory[record.category] || 0) + 1;
  }

  return { count, averagePrice: Math.round(total / count), byCategory, lastDigest: digest.slice(0, 16) };
}

module.exports = { heavyStats };