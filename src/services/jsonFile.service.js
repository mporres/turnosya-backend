const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function resolveFilePath(fileName) {
  return path.join(DATA_DIR, fileName);
}

async function readJsonFile(fileName) {
  const filePath = resolveFilePath(fileName);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw new Error(`No se pudo leer el archivo ${fileName}: ${err.message}`);
  }
}

async function writeJsonFile(fileName, data) {
  const filePath = resolveFilePath(fileName);
  try {
    const json = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, json + '\n', 'utf-8');
  } catch (err) {
    throw new Error(`No se pudo escribir el archivo ${fileName}: ${err.message}`);
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
