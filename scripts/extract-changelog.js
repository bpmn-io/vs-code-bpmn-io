/**
 * Extracts the changelog section for a given version from CHANGELOG.md.
 *
 * Usage: node scripts/extract-changelog.js <version>
 * Output: the markdown content for that version's section (without the heading)
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node extract-changelog.js <version>');
  process.exit(1);
}

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

if (!fs.existsSync(changelogPath)) {
  console.log('*(No CHANGELOG.md found)*');
  process.exit(0);
}

const changelog = fs.readFileSync(changelogPath, 'utf8');
const lines = changelog.split('\n');

// Find the heading for this version (e.g., "## 0.20.0" or "## 0.20.0 (2026-01-20)")
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith(`## ${version}`)) {
    start = i + 1;
    break;
  }
}

if (start === -1) {
  console.log(`*(No changelog entry found for version ${version})*`);
  process.exit(0);
}

// Find the next ## heading (end of this section)
let end = lines.length;
for (let i = start; i < lines.length; i++) {
  if (lines[i].startsWith('## ')) {
    end = i;
    break;
  }
}

// Extract, trim leading/trailing blank lines
const notes = lines.slice(start, end).join('\n').trim();

if (!notes) {
  console.log(`*(Empty changelog entry for version ${version})*`);
} else {
  console.log(notes);
}
