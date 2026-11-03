#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// When CLAUDE.md has unstaged edits, skip the update entirely: \`git add\` would sweep those edits into this commit.
// The next commit made without them picks the update up.
const hook = `#!/bin/sh
if git diff --quiet -- CLAUDE.md; then
  node scripts/update-claude-md.js
  git add CLAUDE.md
fi
`;

const hookPath = path.join(__dirname, '..', '.git', 'hooks', 'pre-commit');
fs.writeFileSync(hookPath, hook, {mode: 0o755});
console.log('Git hooks installed.');
