const { parentPort, workerData } = require('worker_threads');
const { heavyStats } = require('./compute');

parentPort.postMessage(heavyStats(workerData.file, workerData.rounds));