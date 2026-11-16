const fs = require('fs');

console.log('A: синхронный код');
setTimeout(() => console.log('B: setTimeout 0'), 0);
setImmediate(() => console.log('E: setImmediate'));
process.nextTick(() => console.log('F: process.nextTick'));
Promise.resolve().then(() => console.log('C: Promise.then'));
fs.readFile(__filename, () => console.log('G: колбэк fs.readFile'));
console.log('D: синхронный код');