#!/usr/bin/env node
/**
 * ota-publish.mjs: publish StraboField over-the-air updates to the StraboSpot
 * update server (/ota/, Expo Updates protocol v1). Node 18 or newer, no
 * packages needed.
 *
 * The manifest is built AND SIGNED on the publishing computer; the server only
 * checks it and stores its exact bytes, so the private key never leaves here.
 *
 * Environment:
 *   OTA_SERVER   server address (default https://strabospot.org)
 *   OTA_TOKEN    publish token (required)
 *
 * Commands:
 *   publish   --dist <dir> --runtime-ios <ver> --runtime-android <ver> --key <private-key.pem>
 *             [--platform ios|android|all] [--channel production] [--config <public config .json>]
 *             [--project <app dir>] [--message <text>] [--dry-run]
 *       Uploads files the server does not have yet, then one signed update per platform.
 *       Without --config, runs `npx expo config --type public --json` in --project (default .).
 *   list      [--platform ios|android] [--channel <name>] [--runtime <ver>] [--limit N]
 *   show      <releaseId>
 *   withdraw  <releaseId> [--note <text>]
 *       Phones stop being offered it. Phones that already have it keep it: follow with
 *       `republish <older releaseId>` (or rollback-to-embedded) to move them off it.
 *   restore   <releaseId>
 *   republish <releaseId> --key <private-key.pem> [--message <text>]
 *       The same files under a new id and today's date, so phones take it as newest.
 *   rollback-to-embedded --platform ios|android --runtime <ver> [--channel production] --key <pem>
 *       Tells phones on that build to go back to the bundle inside the store build.
 *   stats     [--days 30]
 *
 * @package    StraboSpot Web Site
 * @copyright  2026 StraboSpot
 * @license    https://opensource.org/licenses/MIT MIT License
 */

import { createHash, createSign, randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const SERVER = (process.env.OTA_SERVER || 'https://strabospot.org').replace(/\/+$/, '');
const TOKEN = process.env.OTA_TOKEN || '';

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.json': 'application/json', '.js': 'application/javascript', '.hbc': 'application/javascript',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'video/mp4',
  '.html': 'text/html', '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf',
  '.db': 'application/octet-stream', '.zip': 'application/zip',
};

function die(msg) {
  console.error('ota-publish: ' + msg);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const name = a.slice(2);
      if (name === 'dry-run') { out[name] = true; continue; }
      if (i + 1 >= argv.length) die(`--${name} needs a value`);
      out[name] = argv[++i];
    } else {
      out._.push(a);
    }
  }
  return out;
}

async function api(method, path, body, raw = false) {
  if (!TOKEN) die('set OTA_TOKEN to the publish token');
  const headers = { authorization: `Bearer ${TOKEN}` };
  let payload;
  if (raw) {
    headers['content-type'] = 'application/octet-stream';
    payload = body;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${SERVER}/ota/publish/${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: 'not_json', message: text.slice(0, 300) }; }
  if (!res.ok) {
    const err = new Error(`${method} ${path}: HTTP ${res.status} ${data.error || ''}: ${data.message || ''}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const sha256 = (buf) => createHash('sha256').update(buf).digest();
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function sign(body, keyPath) {
  if (!keyPath) die('--key <private-key.pem> is required (the server only accepts signed releases)');
  const pem = readFileSync(keyPath, 'utf8');
  return createSign('RSA-SHA256').update(body, 'utf8').sign(pem, 'base64');
}

function describeFile(path, ext, contentType, prefix) {
  const buf = readFileSync(path);
  const digest = sha256(buf);
  return {
    path, buf,
    hex: digest.toString('hex'),
    entry: {
      hash: b64url(digest),
      key: createHash('md5').update(buf).digest('hex'),
      contentType,
      fileExtension: ext || undefined,
      url: prefix + digest.toString('hex') + (ext || ''),
    },
  };
}

function publicConfig(args) {
  if (args.config) return JSON.parse(readFileSync(args.config, 'utf8'));
  const out = execFileSync('npx', ['expo', 'config', '--type', 'public', '--json'],
    { cwd: args.project || '.', encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  return JSON.parse(out);
}

async function publish(args) {
  const dist = args.dist || 'dist';
  const metaPath = join(dist, 'metadata.json');
  if (!existsSync(metaPath)) die(`${metaPath} not found (run npx expo export first)`);
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const which = args.platform && args.platform !== 'all' ? [args.platform] : ['ios', 'android'];
  for (const p of which) {
    if (!meta.fileMetadata || !meta.fileMetadata[p]) die(`${metaPath} has no ${p} bundle`);
    if (!args[`runtime-${p}`]) die(`--runtime-${p} is required`);
  }
  const channel = args.channel || 'production';
  const ping = await api('GET', 'ping');
  const prefix = ping.assetUrlPrefix;
  const expoClient = publicConfig(args);
  const createdAt = new Date().toISOString();

  const plans = [];
  for (const p of which) {
    const fm = meta.fileMetadata[p];
    const launch = describeFile(join(dist, fm.bundle), extname(fm.bundle), 'application/javascript', prefix);
    launch.entry.fileExtension = '.bundle';
    const assets = (fm.assets || []).map((a) => {
      const ext = a.ext ? '.' + a.ext.replace(/^\./, '') : '';
      return describeFile(join(dist, a.path), ext, MIME[ext.toLowerCase()] || 'application/octet-stream', prefix);
    });
    const manifest = {
      id: randomUUID(),
      createdAt,
      runtimeVersion: args[`runtime-${p}`],
      launchAsset: launch.entry,
      assets: assets.map((a) => a.entry),
      metadata: {},
      extra: { expoClient },
    };
    plans.push({ platform: p, files: [launch, ...assets], manifest });
  }

  const files = new Map();
  for (const pl of plans) for (const f of pl.files) files.set(f.hex, f);
  const { missing } = await api('POST', 'assets/missing', { sha256: [...files.keys()] });
  let sent = 0;
  for (const hex of missing) {
    const f = files.get(hex);
    if (args['dry-run']) { console.log(`would upload ${f.path} (${f.buf.length} bytes)`); continue; }
    await api('PUT', `assets/${hex}`, f.buf, true);
    sent += f.buf.length;
    console.log(`uploaded ${f.path} (${f.buf.length} bytes)`);
  }
  console.log(`${missing.length} of ${files.size} files uploaded (${sent} bytes); the rest were already there`);

  for (const pl of plans) {
    const body = JSON.stringify(pl.manifest);
    const release = {
      kind: 'update', platform: pl.platform, runtimeVersion: pl.manifest.runtimeVersion, channel,
      body, signature: sign(body, args.key), message: args.message || null,
    };
    if (args['dry-run']) { console.log(`would publish ${pl.platform} update ${pl.manifest.id}`); continue; }
    const r = await api('POST', 'releases', release);
    console.log(`published ${r.platform} update ${r.updateId} as release ${r.releaseId} (channel ${r.channel}, runtime ${r.runtimeVersion})`);
  }
}

async function republish(args) {
  const id = args._[1];
  if (!id) die('republish <releaseId>');
  const old = await api('GET', `releases/${id}`);
  if (old.kind !== 'update') die(`release ${id} is a directive, not an update`);
  const m = JSON.parse(old.body);
  m.id = randomUUID();
  m.createdAt = new Date().toISOString();
  const body = JSON.stringify(m);
  const r = await api('POST', 'releases', {
    kind: 'update', platform: old.platform, runtimeVersion: old.runtimeVersion, channel: old.channel,
    body, signature: sign(body, args.key), message: args.message || `republish of release ${id}`,
  });
  console.log(`republished release ${id} as release ${r.releaseId}, update ${r.updateId}`);
}

async function rollbackToEmbedded(args) {
  if (!['ios', 'android'].includes(args.platform)) die('--platform ios|android is required');
  if (!args.runtime) die('--runtime <ver> is required');
  const body = JSON.stringify({ type: 'rollBackToEmbedded', parameters: { commitTime: new Date().toISOString() } });
  const r = await api('POST', 'releases', {
    kind: 'rollBackToEmbedded', platform: args.platform, runtimeVersion: args.runtime,
    channel: args.channel || 'production', body, signature: sign(body, args.key), message: args.message || null,
  });
  console.log(`release ${r.releaseId}: ${r.platform} phones on runtime ${r.runtimeVersion} (channel ${r.channel}) go back to the store bundle`);
}

function printReleases(list) {
  for (const r of list) {
    const state = r.withdrawnAt ? `WITHDRAWN ${r.withdrawnAt}` : 'live';
    console.log(`${r.releaseId}\t${r.platform}\t${r.channel}\t${r.kind}\t${r.updateId || '-'}\t${r.createdAt}\t${r.files} files ${r.bytes} B\t${state}\t${r.runtimeVersion}${r.message ? '\t' + r.message : ''}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  switch (cmd) {
    case 'publish': return publish(args);
    case 'republish': return republish(args);
    case 'rollback-to-embedded': return rollbackToEmbedded(args);
    case 'list': {
      const q = new URLSearchParams();
      if (args.platform) q.set('platform', args.platform);
      if (args.channel) q.set('channel', args.channel);
      if (args.runtime) q.set('runtimeVersion', args.runtime);
      if (args.limit) q.set('limit', args.limit);
      const r = await api('GET', 'releases' + (q.size ? '?' + q : ''));
      return printReleases(r.releases);
    }
    case 'show': {
      if (!args._[1]) die('show <releaseId>');
      return console.log(JSON.stringify(await api('GET', `releases/${args._[1]}`), null, 2));
    }
    case 'withdraw': {
      if (!args._[1]) die('withdraw <releaseId>');
      const r = await api('POST', `releases/${args._[1]}/withdraw`, args.note ? { note: args.note } : undefined);
      return printReleases([r]);
    }
    case 'restore': {
      if (!args._[1]) die('restore <releaseId>');
      return printReleases([await api('POST', `releases/${args._[1]}/restore`)]);
    }
    case 'stats': {
      return console.log(JSON.stringify(await api('GET', `stats?days=${args.days || 30}`), null, 2));
    }
    default:
      die('commands: publish, list, show, withdraw, restore, republish, rollback-to-embedded, stats (see the top of this file)');
  }
}

main().catch((e) => die(e.message));
