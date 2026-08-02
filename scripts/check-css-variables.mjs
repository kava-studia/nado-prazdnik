import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

// 1. Gather all defined variables in index.css
const definedVars = new Set();
const indexCssPath = path.join(SRC_DIR, 'index.css');

if (fs.existsSync(indexCssPath)) {
  const content = fs.readFileSync(indexCssPath, 'utf-8');
  // Match declarations like: --var-name: or --color-primary:
  const regex = /(--[a-zA-Z0-9_-]+)\s*:/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    definedVars.add(match[1]);
  }
}

// Add some globally accepted/known CSS variables or browser-defined ones if needed
// For example, safe fallbacks or standard Tailwind variables if they aren't parsed
const knownSafe = new Set([
  '--motion-translate-x',
  '--motion-translate-y',
  '--motion-scale-x',
  '--motion-scale-y',
  '--motion-rotate',
  '--motion-skew-x',
  '--motion-skew-y',
]);

const usedVars = [];
const allFiles = getFiles(SRC_DIR);

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const regex = /var\((--[a-zA-Z0-9_-]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    if (!definedVars.has(varName) && !knownSafe.has(varName)) {
      usedVars.push({ varName, file });
    }
  }
}

if (usedVars.length > 0) {
  console.error('\x1b[31mError: Found usage of undefined CSS variables:\x1b[0m');
  const uniqueMissing = {};
  for (const item of usedVars) {
    if (!uniqueMissing[item.varName]) {
      uniqueMissing[item.varName] = [];
    }
    uniqueMissing[item.varName].push(path.relative(process.cwd(), item.file));
  }
  for (const [v, files] of Object.entries(uniqueMissing)) {
    console.error(`- \x1b[33m${v}\x1b[0m used in:\n  ${[...new Set(files)].join('\n  ')}`);
  }
  process.exit(1);
} else {
  console.log('\x1b[32mSuccess: All used CSS variables are properly defined in index.css!\x1b[0m');
  process.exit(0);
}
