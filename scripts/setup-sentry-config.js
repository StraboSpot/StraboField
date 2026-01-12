#!/usr/bin/env node

/**
 * This script generates sentry.properties files from env.json
 * Run this before any sentry-cli commands to ensure auth token is current
 */

const fs = require('fs');
const path = require('path');

// Read env.json
const envPath = path.join(__dirname, '..', 'env.json');
let env;

try {
  env = JSON.parse(fs.readFileSync(envPath, 'utf8'));
}
catch (error) {
  console.error('Error reading env.json:', error.message);
  console.error('Please create env.json with your Sentry auth token');
  process.exit(1);
}

// Get auth token from env.json
const authToken = env.sentry_organization_auth_token;

if (!authToken) {
  console.error('Error: sentry_organization_auth_token not found in env.json');
  process.exit(1);
}

// Sentry properties content
const sentryPropertiesContent =
  `defaults.url=https://sentry.io/
defaults.org=university-of-kansas
defaults.project=strabospot-2
auth.token=${authToken}`;

// Write to iOS
const iosPath = path.join(__dirname, '..', 'ios', 'sentry.properties');
fs.writeFileSync(iosPath, sentryPropertiesContent);
console.log('✓ Generated ios/sentry.properties');

// Write to Android
const androidPath = path.join(__dirname, '..', 'android', 'sentry.properties');
fs.writeFileSync(androidPath, sentryPropertiesContent);
console.log('✓ Generated android/sentry.properties');

console.log('✓ Sentry configuration files updated from env.json');
