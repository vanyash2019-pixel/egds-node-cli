const fs = require('fs');
const { Writable } = require('stream');
const { pipeline } = require('stream/promises');
const { LineSplitter } = require('./lineSplitter');
const { requireBigFile } = require('../paths');
const { AppError } = require('../fs/errors');

async function compare(mode) {
  const file = requireBigFile();
  const startedAt = process.hrtime.bigint();
  let count = 0;
  let total = 0;

  if (mode === 'full') {
    // Вариант 1: весь файл целиком в память
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      if (!line) continue;
      count++;
      total += JSON.parse(line).price;
    }
  } else if (mode === 'stream') {
    // Вариант 2: поток, обрабатываем по кускам
    await pipeline(
      fs.createReadStream(file),
      new LineSplitter(),
      new Writable({
        objectMode: true,
        write(line, encoding, callback) {
          try {
            count++;
            total += JSON.parse(line).price;
            callback();
          } catch (err) {
            callback(err);
          }
        },
      })
    );
  } else {
    throw new AppError('Режим должен быть "full" или "stream".');
  }

  const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
  const sizeMb = fs.statSync(file).size / 1024 / 1024;
  const peakRssMb = process.resourceUsage().maxRSS / 1024; // пик памяти процесса
  const heapMb = process.memoryUsage().heapUsed / 1024 / 1024;

  console.log(`Режим: ${mode}`);
  console.log(`Размер файла: ${sizeMb.toFixed(1)} МБ`);
  console.log(`Записей: ${count}, сумма цен: ${total}`);
  console.log(`Время: ${ms.toFixed(0)} мс`);
  console.log(`Пик памяти процесса (RSS): ${peakRssMb.toFixed(0)} МБ`);
  console.log(`heapUsed в конце: ${heapMb.toFixed(0)} МБ`);
}

module.exports = { compare };