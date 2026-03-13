#!/usr/bin/env node
// Wrapper that runs import-clubs and writes output to a log file
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

try {
  const output = execSync('node scripts/import-clubs.mjs', {
    cwd: rootDir,
    encoding: 'utf-8',
    timeout: 120000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  writeFileSync(join(rootDir, 'import-output.log'), output, 'utf-8');
  console.log(output);
} catch (err) {
  const combined = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + err.message;
  writeFileSync(join(rootDir, 'import-output.log'), combined, 'utf-8');
  console.error(combined);
}
