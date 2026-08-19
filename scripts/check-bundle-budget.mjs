import { gzipSync } from 'node:zlib';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = new URL('../dist/assets/', import.meta.url);
const files = await readdir(assetsDir);

const budgets = {
  initialJsGzip: 85 * 1024,
  initialCssGzip: 15 * 1024,
  lazyChunkGzip: 30 * 1024,
};

function format(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function gzipSize(file) {
  const content = await readFile(new URL(file, assetsDir));
  return gzipSync(content).byteLength;
}

const jsFiles = files.filter((file) => file.endsWith('.js'));
const cssFiles = files.filter((file) => file.endsWith('.css'));
const initialJs = jsFiles.find((file) => /^index-[^.]+\.js$/.test(file));
const initialCss = cssFiles.find((file) => /^index-[^.]+\.css$/.test(file));

if (!initialJs || !initialCss) {
  throw new Error(`Could not identify initial Vite assets in ${path.resolve('dist/assets')}`);
}

const initialJsSize = await gzipSize(initialJs);
const initialCssSize = await gzipSize(initialCss);
console.log(`Initial JS gzip: ${format(initialJsSize)} (${initialJs})`);
console.log(`Initial CSS gzip: ${format(initialCssSize)} (${initialCss})`);

if (initialJsSize > budgets.initialJsGzip) {
  throw new Error(`Initial JS exceeds ${format(budgets.initialJsGzip)} budget: ${format(initialJsSize)}`);
}
if (initialCssSize > budgets.initialCssGzip) {
  throw new Error(`Initial CSS exceeds ${format(budgets.initialCssGzip)} budget: ${format(initialCssSize)}`);
}

for (const file of jsFiles.filter((file) => file !== initialJs)) {
  const size = await gzipSize(file);
  console.log(`Lazy JS gzip: ${format(size)} (${file})`);
  if (size > budgets.lazyChunkGzip) {
    throw new Error(`Lazy JS chunk exceeds ${format(budgets.lazyChunkGzip)} budget: ${file} is ${format(size)}`);
  }
}

console.log('Bundle budget passed.');
