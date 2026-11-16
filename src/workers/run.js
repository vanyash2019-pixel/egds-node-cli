const path = require('path');
const readline = require('readline');
const { Worker } = require('worker_threads');
const { heavyStats } = require('./compute');
const { requireBigFile } = require('../paths');

// "Живой" интерфейс: точки каждые 200 мс и ответ на введённые строки.
// Если основной поток занят, ни то ни другое работать не будет.
function startInteractive() {
  let ticks = 0;
  const timer = setInterval(() => {
    ticks++;
    process.stdout.write('.');
  }, 200);
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (line) => console.log(`\n[основной поток ответил] pong: ${line}`));

  return {
    getTicks: () => ticks,
    stop: () => {
      clearInterval(timer);
      rl.close();
    },
  };
}

function printResult(label, startedAt, ticks, result) {
  console.log(`\n${label}: время ${Date.now() - startedAt} мс`);
  console.log(`Тиков (точек) за время вычисления: ${ticks}`);
  console.log('Результат:', result);
}

// Вариант A: считаем прямо в основном потоке
async function runMain(rounds) {
  const file = requireBigFile();
  console.log('Вариант A: основной поток. Пишите любой текст + Enter, пока идёт расчёт.');
  const ui = startInteractive();
  await new Promise((resolve) => setTimeout(resolve, 300));

  const startedAt = Date.now();
  const ticksBefore = ui.getTicks();
  const result = heavyStats(file, rounds); // блокирует event loop
  printResult('Вариант A', startedAt, ui.getTicks() - ticksBefore, result);

  await new Promise((resolve) => setTimeout(resolve, 500)); // дать обработать набранное
  ui.stop();
}

// Вариант B: то же вычисление в Worker Thread
async function runWorker(rounds) {
  const file = requireBigFile();
  console.log('Вариант B: Worker Thread. Пишите любой текст + Enter, пока идёт расчёт.');
  const ui = startInteractive();
  await new Promise((resolve) => setTimeout(resolve, 300));

  const startedAt = Date.now();
  const ticksBefore = ui.getTicks();

  try {
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'worker.js'), { workerData: { file, rounds } });
      worker.once('message', resolve);
      worker.once('error', reject);
      worker.once('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker завершился с кодом ${code}`));
      });
    });
    printResult('Вариант B', startedAt, ui.getTicks() - ticksBefore, result);
  } finally {
    ui.stop();
  }
}

module.exports = { runMain, runWorker };