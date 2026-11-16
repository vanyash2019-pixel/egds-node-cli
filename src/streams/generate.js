const fs = require('fs');
const { once } = require('events');
const { BIG_DIR, BIG_FILE } = require('../paths');

const CATEGORIES = ['avtomatika', 'radioupravlenie', 'svobodnyy-vyezd'];
const NAMES = ['Шлагбаум', 'Пульт', 'Датчик', 'Кабель', 'Контроллер', 'Считыватель', 'Блок питания', 'Антенна'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Пишем файл построчно через Writable Stream
async function generateBigFile(count) {
  fs.mkdirSync(BIG_DIR, { recursive: true });
  const out = fs.createWriteStream(BIG_FILE, { encoding: 'utf8' });

  for (let i = 1; i <= count; i++) {
    const record = {
      id: i,
      name: `${pick(NAMES)} модель ${i}`,
      category: pick(CATEGORIES),
      price: 500 + Math.floor(Math.random() * 150000),
      description: 'Надёжное оборудование для систем безопасности и контроля доступа дворовых территорий.',
    };
    const canWriteMore = out.write(JSON.stringify(record) + '\n');
    // Если внутренний буфер переполнен, ждём, пока поток его опустошит (backpressure)
    if (!canWriteMore) await once(out, 'drain');
  }

  out.end();
  await once(out, 'finish');
  return BIG_FILE;
}

module.exports = { generateBigFile };