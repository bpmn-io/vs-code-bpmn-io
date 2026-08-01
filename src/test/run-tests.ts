import * as path from 'node:path';

import { cp } from 'shelljs';

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
    // Pin to a known-stable version to avoid ENOENT issues
    // with bleeding-edge VS Code releases on macOS (e.g. 1.131.0 changed .app structure)
    await runTests({ extensionDevelopmentPath, extensionTestsPath, version: '1.100.2' });
  } catch (err) {
    process.exit(1);
  }
}

function copyTestFiles() {
  const src = path.resolve(__dirname, '../..', 'src', 'test', 'fixtures');

  const dest = path.resolve(__dirname, 'fixtures');

  cp('-R', src, dest);
}

copyTestFiles();
main();
