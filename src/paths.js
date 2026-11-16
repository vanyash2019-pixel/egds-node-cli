const fs = require('fs');
const path = require('path');
const { AppError } = require('./fs/errors');

const ROOT = path.join(__dirname, '..');
const BIG_DIR = path.join(ROOT, 'bigdata');
const BIG_FILE = path.join(BIG_DIR, 'products-big.jsonl');
const CSV_FILE = path.join(BIG_DIR, 'products-big.csv');

function requireBigFile() {
  if (!fs.existsSync(BIG_FILE)) {
    throw new AppError('Большой файл не найден. Сначала выполните: node app.js gen-big');
  }
  return BIG_FILE;
}

module.exports = { BIG_DIR, BIG_FILE, CSV_FILE, requireBigFile };