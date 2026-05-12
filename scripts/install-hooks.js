#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const hook = `#!/bin/sh
node scripts/update-claude-md.js
git add CLAUDE.md
`;

const hookPath = path.join(__dirname, '..', '.git', 'hooks', 'pre-commit');
fs.writeFileSync(hookPath, hook, {mode: 0o755});
console.log('Git hooks installed.');
