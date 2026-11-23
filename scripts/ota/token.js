const fs = require('fs');
const path = require('path');

const SECRETS_PATH = path.join(__dirname, '..', '..', 'secrets.json');

// The update server's publish token: OTA_TOKEN if set, else ota_publish_token in secrets.json
const getPublishToken = () => {
  if (process.env.OTA_TOKEN) return process.env.OTA_TOKEN;
  if (!fs.existsSync(SECRETS_PATH)) return undefined;
  return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8')).ota_publish_token;
};

// Environment for ota-publish.mjs, which reads the token from OTA_TOKEN
const getPublishEnv = () => {
  const token = getPublishToken();
  if (!token) {
    console.error('ota: no publish token. Add "ota_publish_token" to secrets.json, or set OTA_TOKEN.');
    process.exit(1);
  }
  return {...process.env, OTA_TOKEN: token};
};

module.exports = {getPublishEnv};
