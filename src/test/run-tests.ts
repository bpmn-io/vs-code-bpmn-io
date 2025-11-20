import * as path from 'node:path';

import * as fs from 'node:fs';

import { runTests } from '@vscode/test-electron';

async function main() {
  try {

    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Download VS Code, unzip it and run the integration test
    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    process.exit(1);
  }
}

function copyTestFiles() {
  const src = path.resolve(__dirname, '../..', 'src', 'test', 'fixtures');

  const dest = path.resolve(__dirname, 'fixtures');

  fs.cpSync(src, dest, { recursive: true });
}

copyTestFiles();
main();
