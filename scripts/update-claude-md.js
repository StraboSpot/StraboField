#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const claudeMdPath = path.join(root, 'CLAUDE.md');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const strip = v => (v || '').replace(/^[\^~]/, '');

const react = strip(packageJson.dependencies?.react);
const reactNative = strip(packageJson.dependencies?.['react-native']);
const reduxToolkit = strip(packageJson.dependencies?.['@reduxjs/toolkit']);
const rnmapbox = strip(packageJson.dependencies?.['@rnmapbox/maps']);
const formik = strip(packageJson.dependencies?.formik);
const yarn = (packageJson.packageManager || '').replace('yarn@', '');

const modulesDir = path.join(root, 'src', 'modules');
const moduleCount = fs.readdirSync(modulesDir).filter(f =>
  fs.statSync(path.join(modulesDir, f)).isDirectory()
).length;

let content = fs.readFileSync(claudeMdPath, 'utf8');

content = content.replace(
  /\*\*\d+ self-contained feature modules\*\*/,
  `**${moduleCount} self-contained feature modules**`
);
content = content.replace(
  /- React [\d.]+ \+ React Native [\d.]+/,
  `- React ${react} + React Native ${reactNative}`
);
content = content.replace(
  /- Redux Toolkit [\d.]+ \+ Redux Persist/,
  `- Redux Toolkit ${reduxToolkit} + Redux Persist`
);
content = content.replace(
  /@rnmapbox\/maps [\d.]+ for native/,
  `@rnmapbox/maps ${rnmapbox} for native`
);
content = content.replace(
  /- Formik [\d.]+ - Form management/,
  `- Formik ${formik} - Form management`
);
if (yarn) {
  content = content.replace(
    /\*\*Package manager:\*\* Yarn [\d.]+/,
    `**Package manager:** Yarn ${yarn}`
  );
}

fs.writeFileSync(claudeMdPath, content);
console.log(`CLAUDE.md updated: ${moduleCount} modules, React ${react}, RN ${reactNative}, Yarn ${yarn}`);
