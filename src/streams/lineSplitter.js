const { Transform } = require('stream');
const { StringDecoder } = require('string_decoder');

// Принимает произвольные chunk'и и выдаёт целые строки.
// Chunk может обрезаться посреди строки (или посреди русской буквы), поэтому остаток храним.
class LineSplitter extends Transform {
  constructor() {
    super({ readableObjectMode: true });
    this.decoder = new StringDecoder('utf8');
    this.rest = '';
  }

  _transform(chunk, encoding, callback) {
    this.rest += this.decoder.write(chunk);
    const lines = this.rest.split('\n');
    this.rest = lines.pop(); // последняя часть может быть неполной
    for (const line of lines) {
      if (line.trim()) this.push(line);
    }
    callback();
  }

  _flush(callback) {
    this.rest += this.decoder.end();
    if (this.rest.trim()) this.push(this.rest);
    callback();
  }
}

module.exports = { LineSplitter };