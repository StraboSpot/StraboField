#!/usr/bin/env node

/**
 * This script generates sentry.properties files from secrets.json
 * Run this before any sentry-cli commands to ensure auth token is current
 */

const fs = require('fs');
const path = require('path');

// Read secrets.json
const secretsPath = path.join(__dirname, '..', 'secrets.json');
let secrets;

try {
  secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
}
catch (error) {
  console.error('Error reading secrets.json:', error.message);
  console.error('Please create secrets.json with your Sentry auth token');
  process.exit(1);
}

// Get auth token from secrets.json
const authToken = secrets.sentry_organization_auth_token;

if (!authToken) {
  console.error('Error: sentry_organization_auth_token not found in secrets.json');
  process.exit(1);
}

// Sentry properties content
const sentryPropertiesContent
  = `defaults.url=https://sentry.io/
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

console.log('✓ Sentry configuration files updated from secrets.json');
