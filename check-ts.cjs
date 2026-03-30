const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const projectPath = process.cwd();
const configPath = path.join(projectPath, 'tsconfig.app.json');

const configContent = fs.readFileSync(configPath, 'utf8');
const tsConfig = JSON.parse(configContent);

// Get all source files
const srcDir = path.join(projectPath, 'src');
const files = [];

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('__') && !entry.name.startsWith('.')) {
        walkDir(path.join(dir, entry.name));
      }
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(path.join(dir, entry.name));
    }
  }
}

walkDir(srcDir);

const compilerOptions = {
  ...tsConfig.compilerOptions,
  skipLibCheck: true,
  noEmit: true,
};

const program = ts.createProgram(files, compilerOptions);
const diagnostics = ts.getPreEmitDiagnostics(program);

console.log(`Total TypeScript errors: ${diagnostics.length}`);
console.log('');

const errorsByFile = {};
diagnostics.forEach(diag => {
  if (diag.file) {
    const fileName = diag.file.fileName;
    if (!errorsByFile[fileName]) {
      errorsByFile[fileName] = [];
    }
    errorsByFile[fileName].push(diag);
  }
});

let shownErrors = 0;
Object.keys(errorsByFile).sort().forEach(file => {
  if (shownErrors >= 30) return;
  const fileErrors = errorsByFile[file];
  console.log(`\n${path.relative(projectPath, file)} (${fileErrors.length} errors):`);
  fileErrors.forEach(diag => {
    if (shownErrors >= 30) return;
    const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
    const pos = diag.file.getLineAndCharacterOfPosition(diag.start);
    console.log(`  Line ${pos.line + 1}: ${message}`);
    shownErrors++;
  });
});
