const readline = require('readline');
const store = require('./src/fs/store');
const { AppError } = require('./src/fs/errors');
const { generateBigFile } = require('./src/streams/generate');
const { convertBigFile } = require('./src/streams/convert');
const { compare } = require('./src/streams/compare');


const commands = {
  create: {
    usage: 'create <id> "<название>" "<категория>" <цена>',
    minArgs: 4,
    run: async ([id, name, category, price]) => {
      const record = await store.createProduct(id, name, category, price);
      console.log('Запись создана:', record);
    },
  },
  read: {
    usage: 'read <id>',
    minArgs: 1,
    run: async ([id]) => console.log(await store.readProduct(id)),
  },
  list: {
    usage: 'list',
    minArgs: 0,
    run: async () => {
      const items = await store.listProducts();
      if (items.length === 0) console.log('Список пуст.');
      else console.table(items);
    },
  },
  update: {
    usage: 'update <id> <поле: name|category|price> "<значение>"',
    minArgs: 3,
    run: async ([id, field, value]) => {
      console.log('Запись обновлена:', await store.updateProduct(id, field, value));
    },
  },
  delete: {
    usage: 'delete <id>',
    minArgs: 1,
    run: async ([id]) => {
      await store.deleteProduct(id);
      console.log(`Запись ${id} удалена.`);
    },
  },
  rename: {
    usage: 'rename <id> <новое_имя_файла>',
    minArgs: 2,
    run: async ([id, newName]) => {
      const file = await store.renameProduct(id, newName);
      console.log(`Файл записи ${id} переименован в ${file}, индекс обновлён.`);
    },
  },
  backup: {
    usage: 'backup <исходный_каталог> <каталог_копии>',
    minArgs: 2,
    run: async ([src, dest]) => {
      const { dest: where, count } = await store.backup(src, dest);
      console.log(`Резервная копия создана: ${where} (файлов: ${count}).`);
    },
  },
  search: {
    usage: 'search   (интерактивный поиск по названию)',
    minArgs: 0,
    run: async () => interactiveSearch(),
  },
    'gen-big': {
    usage: 'gen-big [количество записей, по умолчанию 400000]',
    minArgs: 0,
    run: async ([countRaw = '400000']) => {
      const count = Number(countRaw);
      if (!Number.isInteger(count) || count <= 0) {
        throw new AppError(`Количество должно быть целым числом больше нуля, получено "${countRaw}".`);
      }
      console.log('Генерация файла...');
      const file = await generateBigFile(count);
      console.log('Готово:', file);
    },
  },
  convert: {
    usage: 'convert   (большой JSONL в CSV через Transform Stream)',
    minArgs: 0,
    run: async () => {
      console.log('Преобразование...');
      console.log('Готово:', await convertBigFile());
    },
  },
  compare: {
    usage: 'compare <full|stream>   (сравнение readFileSync и Stream)',
    minArgs: 1,
    run: async ([mode]) => compare(mode),
  },
};

async function interactiveSearch() {
  const items = await store.listProducts();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  while (true) {
    const query = (await ask('Поиск (пустая строка - выход): ')).trim().toLowerCase();
    if (!query) break;
    // toLowerCase с обеих сторон делает поиск регистронезависимым
    const found = items.filter((i) => i.name.toLowerCase().includes(query));
    if (found.length === 0) console.log('Ничего не найдено.');
    else console.table(found);
  }
  rl.close();
}

function printHelp() {
  console.log('Использование: node app.js <команда> [аргументы]\n');
  for (const cmd of Object.values(commands)) console.log('  ' + cmd.usage);
}

function describeError(err) {
  if (err instanceof AppError) return err.message;
  const known = {
    ENOENT: 'Файл или каталог не найден',
    EACCES: 'Нет доступа',
    EPERM: 'Операция запрещена',
    EEXIST: 'Уже существует',
    ENOTDIR: 'Ожидался каталог',
  };
  if (err.code && known[err.code]) return `${known[err.code]}: ${err.path || ''}`;
  return `Непредвиденная ошибка: ${err.message}`;
}

async function main() {
  // process.argv: [путь к node, путь к app.js, ...аргументы пользователя]
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === 'help') {
    printHelp();
    return;
  }
  const cmd = commands[command];
  if (!cmd) throw new AppError(`Неизвестная команда "${command}". Список команд: node app.js help`);
  if (args.length < cmd.minArgs) {
    throw new AppError(
      `Недостаточно аргументов для "${command}" (нужно ${cmd.minArgs}, передано ${args.length}).\n` +
        `Использование: node app.js ${cmd.usage}`
    );
  }
  await cmd.run(args);
}

main().catch((err) => {
  console.error('Ошибка: ' + describeError(err));
  process.exit(err instanceof AppError ? err.exitCode : 2);
});