const fs = require('fs');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const { LineSplitter } = require('./lineSplitter');
const { requireBigFile, CSV_FILE } = require('../paths');
const { AppError } = require('../fs/errors');

// Transform: строка JSON на входе, строка CSV на выходе
class JsonToCsv extends Transform {
  constructor() {
    super({ writableObjectMode: true });
    this.headerWritten = false;
  }

  _transform(line, encoding, callback) {
    try {
      const r = JSON.parse(line);
      let out = '';
      if (!this.headerWritten) {
        out += 'id;name;category;price\n';
        this.headerWritten = true;
      }
      out += `${r.id};${r.name.toUpperCase()};${r.category};${r.price}\n`;
      callback(null, out);
    } catch {
      callback(new AppError(`Некорректный JSON в строке: ${line.slice(0, 60)}`));
    }
  }
}

async function convertBigFile() {
  const file = requireBigFile();
  await pipeline(
    fs.createReadStream(file), // Readable
    new LineSplitter(), // Transform №1
    new JsonToCsv(), // Transform №2
    fs.createWriteStream(CSV_FILE) // Writable
  );
  return CSV_FILE;
}

module.exports = { convertBigFile };