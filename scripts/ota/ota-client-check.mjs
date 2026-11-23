#!/usr/bin/env node
/**
 * ota-client-check.mjs: asks the update server for an update the way the
 * StraboField app does (Expo Updates protocol v1) and checks the answer like
 * the app would: signature against the certificate, every file downloaded and
 * its SHA-256 compared with the manifest. Node 18 or newer, no packages.
 *
 *   node ota-client-check.mjs --platform ios --runtime <ver> [--channel production]
 *        [--server https://strabospot.org] [--cert certificate.pem] [--current <update id>]
 *        [--client-id <id>] [--no-download]
 *
 * Without --cert the request does not ask for a signature. Exit code 0 = all
 * checks passed (including "no update"), 1 = something failed.
 *
 * @package    StraboSpot Web Site
 * @copyright  2026 StraboSpot
 * @license    https://opensource.org/licenses/MIT MIT License
 */

import { createHash, verify, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i].replace(/^--/, '');
  if (a === 'no-download') args[a] = true;
  else args[a] = argv[++i];
}
const server = (args.server || process.env.OTA_SERVER || 'https://strabospot.org').replace(/\/+$/, '');
let failures = 0;
const ok = (msg) => console.log('  ok    ' + msg);
const bad = (msg) => { failures++; console.log('  FAIL  ' + msg); };
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function parseMultipart(contentType, buf) {
  const m = /boundary=("?)([^";]+)\1/i.exec(contentType);
  if (!m) throw new Error('multipart response without a boundary');
  const text = buf.toString('latin1');
  const parts = [];
  for (const chunk of text.split('--' + m[2]).slice(1)) {
    if (chunk.startsWith('--')) break;
    const body = chunk.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const sep = body.indexOf('\r\n\r\n');
    const headers = {};
    for (const line of body.slice(0, sep).split('\r\n')) {
      const i = line.indexOf(':');
      headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
    const name = /name="([^"]+)"/.exec(headers['content-disposition'] || '');
    parts.push({ name: name && name[1], headers, body: Buffer.from(body.slice(sep + 4), 'latin1') });
  }
  return parts;
}

function checkSignature(part, certPem) {
  const h = part.headers['expo-signature'];
  if (!h) return bad(`${part.name}: no expo-signature header`);
  const sig = /sig="([^"]+)"/.exec(h);
  const keyid = /keyid="([^"]+)"/.exec(h);
  if (!sig) return bad(`${part.name}: expo-signature has no sig`);
  const good = verify('RSA-SHA256', part.body, certPem, Buffer.from(sig[1], 'base64'));
  good ? ok(`${part.name}: signature verifies (keyid ${keyid ? keyid[1] : '-'})`) : bad(`${part.name}: signature does NOT verify`);
}

async function main() {
  if (!['ios', 'android'].includes(args.platform) || !args.runtime) {
    console.error('usage: ota-client-check.mjs --platform ios|android --runtime <ver> [--channel c] [--server url] [--cert pem] [--current id]');
    process.exit(2);
  }
  const certPem = args.cert ? readFileSync(args.cert, 'utf8') : null;
  const headers = {
    accept: 'multipart/mixed,application/expo+json,application/json',
    'expo-protocol-version': '1',
    'expo-platform': args.platform,
    'expo-runtime-version': args.runtime,
    'eas-client-id': args['client-id'] || 'ota-client-check-' + randomUUID(),
  };
  if (args.channel) headers['expo-channel-name'] = args.channel;
  if (args.current) headers['expo-current-update-id'] = args.current;
  if (certPem) headers['expo-expect-signature'] = 'sig, keyid="main", alg="rsa-v1_5-sha256"';

  console.log(`GET ${server}/ota/manifest (${args.platform}, runtime ${args.runtime}, channel ${args.channel || 'production'})`);
  const res = await fetch(`${server}/ota/manifest`, { headers });
  const buf = Buffer.from(await res.arrayBuffer());
  res.headers.get('expo-protocol-version') === '1' ? ok('expo-protocol-version: 1') : bad('expo-protocol-version missing');
  res.headers.get('expo-sfv-version') === '0' ? ok('expo-sfv-version: 0') : bad('expo-sfv-version missing');
  /private/.test(res.headers.get('cache-control') || '') ? ok('cache-control ' + res.headers.get('cache-control')) : bad('cache-control is not private: ' + res.headers.get('cache-control'));
  if (res.status === 204) {
    ok('204: no update for this build');
    return;
  }
  if (res.status !== 200) {
    bad(`HTTP ${res.status}: ${buf.toString('utf8').slice(0, 300)}`);
    return;
  }
  const parts = parseMultipart(res.headers.get('content-type') || '', buf);
  const directive = parts.find((p) => p.name === 'directive');
  const manifestPart = parts.find((p) => p.name === 'manifest');
  if (directive) {
    ok('directive: ' + directive.body.toString('utf8'));
    if (certPem) checkSignature(directive, certPem);
    return;
  }
  if (!manifestPart) return bad('200 without a manifest or directive part');
  if (certPem) checkSignature(manifestPart, certPem);
  const m = JSON.parse(manifestPart.body.toString('utf8'));
  ok(`manifest ${m.id}, created ${m.createdAt}, ${m.assets.length} assets + launch asset`);
  m.runtimeVersion === args.runtime ? ok('runtimeVersion matches') : bad(`runtimeVersion ${m.runtimeVersion} != ${args.runtime}`);
  m.extra && m.extra.expoClient ? ok('extra.expoClient present') : bad('extra.expoClient missing');
  if (args['no-download']) return;
  let bytes = 0;
  for (const a of [m.launchAsset, ...m.assets]) {
    const r = await fetch(a.url, { headers: { accept: `${a.contentType}, */*`, 'accept-encoding': 'br, gzip' } });
    const body = Buffer.from(await r.arrayBuffer());
    bytes += body.length;
    if (r.status !== 200) { bad(`${a.url}: HTTP ${r.status}`); continue; }
    if (b64url(createHash('sha256').update(body).digest()) !== a.hash) { bad(`${a.url}: hash does not match`); continue; }
    if ((r.headers.get('content-type') || '').split(';')[0] !== a.contentType) bad(`${a.url}: content-type ${r.headers.get('content-type')} != ${a.contentType}`);
    if (!/immutable/.test(r.headers.get('cache-control') || '')) bad(`${a.url}: cache-control ${r.headers.get('cache-control')}`);
  }
  ok(`downloaded ${1 + m.assets.length} files (${bytes} bytes), every hash matches`);
}

main().then(() => {
  console.log(failures ? `${failures} check(s) FAILED` : 'ALL OK');
  process.exit(failures ? 1 : 0);
}).catch((e) => { console.log('  FAIL  ' + e.message); process.exit(1); });
