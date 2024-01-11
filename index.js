const cors = require('cors');
const express = require('express');
const { google } = require('googleapis');
const nconf = require('nconf');
const { default: fetch } = require('node-fetch');
const { NodeSSH } = require('node-ssh');
const { join, basename } = require('path');
const ExifImage = require('exif').ExifImage;
const CronJob = require('cron').CronJob;
const vision = require('@google-cloud/vision');
const { readFile, writeFile, stat } = require('fs/promises');
const { mkdirSync, existsSync } = require('fs');

require('dotenv').config();

nconf.use('file', { file: './settings.json' });
nconf.load();
nconf.save();

const IS_DOCKER = existsSync('/.dockerenv');
const SSH_ENABLE = IS_DOCKER && process.env.IPAD_IP && process.env.IPAD_PASSWORD;
// const SSH_ENABLE = true;

const imageCache = join(__dirname, 'tmp/');
['album_sm', 'album_lg', 'thumbnail', 'image'].forEach((f) => {
  if (!existsSync(join(imageCache, f))) mkdirSync(join(imageCache, f), { recursive: true });
});

let REFRESH_TOKEN = nconf.get('refresh_token');
let settings = nconf.get('settings') || { iPad: { duration: 60 } };
let cropCache = nconf.get('cropCache') || {};
let lastPing = Date.now() + 60 * 1000;

// Update server time for each client
Object.values(settings).forEach((s) => (s.serverTime = Date.now()));

const mockResponse = false;
const port = process.env.PORT || 8500;
const clientUrl = `http://192.168.1.101:${port}`;
let CACHE = {};

const status = { mode: undefined, brightness: undefined };
const cutoff = -4.5;

const lockCommand = 'activator send libactivator.system.sleepbutton';
const unlockCommand = 'activator send libactivator.lockscreen.dismiss';
const getModeCommand = 'activator current-mode';

const restartScript = '/var/mobile/start.sh';
const startCommand = `chmod +x ${restartScript} && ${restartScript}`;
const restartCommand = `chmod +x ${restartScript} && ${restartScript} --restart`;

const ssh = new NodeSSH();

if (SSH_ENABLE || IS_DOCKER) {
  // Keep ssh connection alive every minute
  setIntervalImmediately(() => {
    if (!ssh.isConnected())
      ssh
        .connect({
          host: process.env.IPAD_IP,
          username: 'mobile',
          password: process.env.IPAD_PASSWORD,
        })
        .then(() => console.log('Connected to iPad'))
        .catch((err) => console.error(`Error connecting to iPad\n${err}`));
  }, 60 * 1000);

  // Check brightness every 20 seconds
  setInterval(checkAmbientLight, 20 * 1000);

  // Check that Safari is running every 5 minutes
  setInterval(start, 5 * 60 * 1000);

  // Restart Safari at 5am daily
  new CronJob('0 5 * * *', restart, null, true, 'America/Los_Angeles');

  // Check for ping every 10 seconds and restart if no ping in 60 seconds (only when application is running)
  setInterval(() => {
    if (Date.now() - lastPing > 60 * 1000 && ssh.isConnected()) {
      // status.mode is updated from checking ambient light
      if (status.mode === 'application') {
        console.log('No ping in 60 seconds, restarting Safari');
        restart();
      } else {
        lastPing = Date.now(); // reset ping time when not running application
      }
    }
  }, 10 * 1000);

  // Restart Safari on server restart
  setTimeout(async () => {
    if (ssh.isConnected()) await ssh.putFile(join(__dirname, 'start.sh'), restartScript);
    await restart();
  }, 10 * 1000);
}

// Clear the cache every 15 minutes
setInterval(() => {
  CACHE = {};
}, 15 * 60 * 1000);

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = process.env;
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
const visionClient = new vision.ImageAnnotatorClient({ authClient: oauth2Client });

const mockedIds = new Set();
while (mockedIds.size < 50) mockedIds.add(Math.floor(Math.random() * 1000));

const app = express();

if (REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
  });
} else {
  console.error(`No refresh token found, you must authenticate at http://localhost:${port}/oauth before using photos endpoints`);
}

if (!CLIENT_ID) console.error('Missing env var: CLIENT_ID');
if (!CLIENT_SECRET) console.error('Missing env var: CLIENT_SECRET');
if (!REDIRECT_URL) console.error('Missing env var: REDIRECT_URL');

if (!mockResponse && (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URL)) process.exit(1);

app.use(cors());
app.use(express.json());

app.listen(port, '0.0.0.0', () => {
  console.log(`Example app listening on port ${port}`);
});

app.use('/', express.static('dist'));

app.get('/oauth', async (req, res) => {
  // If the callback passed a code
  if (req.query.code) {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);

    REFRESH_TOKEN = tokens.refresh_token;

    nconf.set('refresh_token', tokens.refresh_token);
    nconf.save();

    res.redirect(clientUrl);
  } else if (req.query.logout) {
    REFRESH_TOKEN = undefined;
    oauth2Client.setCredentials({});

    nconf.set('refresh_token', undefined);
    nconf.save();

    res.redirect(req.query.redirect);

    CACHE = {};
  } else {
    // Generate a redirect url to authenticate user
    const scopes = ['https://www.googleapis.com/auth/photoslibrary.readonly', 'https://www.googleapis.com/auth/cloud-vision'];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // access + prompt forces a new refresh token
      prompt: 'consent',
      scope: scopes.join(' '),
    });

    res.redirect(url);
  }
});

app.get('/albums', async (req, res) => {
  if (mockResponse) {
    res.send({ albums: [{ title: 'Test Album', id: 475, mediaItemsCount: 3 }] });
    return;
  }

  const url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=50';
  authAndCache(url, undefined, res);
});

app.get('/album/:id/:page?', async (req, res) => {
  if (mockResponse) {
    res.send({
      mediaItems: Array.from(mockedIds).map((i) => ({ id: i })),
    });
    return;
  }

  const url = `https://photoslibrary.googleapis.com/v1/mediaItems:search`;
  authAndCache(
    url,
    {
      pageSize: '100',
      albumId: req.params.id,
      pageToken: req.params.page,
    },
    res
    // true // for now, always skip cache since we will always need new base photos
  );
});

app.get('/image', (req, res) => {
  const size = req.query.size;

  const rng = mulberry32(req.query.id || 0);
  const color = `hsl(${rng() * 360}, 80%, 70%)`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${color}"/></svg>`
  );
});

app.get('/image/:id', async (req, res) => {
  const id = req.params.id;
  const url = req.query.url;
  const subdir = req.query.subdir?.toString() || '';

  const file = join(imageCache, subdir, id + '.jpg');

  async function getFile() {
    // console.log('Fetching image', id, file);
    const data = await fetch(url);
    const image = await data.buffer();
    await writeFile(file, image);

    res.send(image);
  }

  const cached = await stat(file).catch((err) => {});

  if (cached) {
    // console.log('Using cached image', id);
    const image = await readFile(file);

    // Attempt to refetch if cached image is invalid
    if (image.toString().includes('<!DOCTYPE html>')) {
      console.log('Cached image is invalid, refetching', id);
      await getFile();
    } else res.send(image);
  } else {
    await getFile();
  }
});

app.get('/settings/:client/:option', (req, res) => {
  const { client, option } = req.params;

  lastPing = Date.now();

  if (option === 'login') {
    res.send({ login: REFRESH_TOKEN !== undefined || mockResponse });
    return;
  }

  if (settings[client]) {
    res.send({ [option]: settings[client][option] });
  } else {
    res.sendStatus(404);
  }
});

app.post('/settings/:client/:option', (req, res) => {
  const { client, option } = req.params;

  if (settings[client]) {
    settings[client][option] = req.body[option];
    nconf.set('settings', settings);
    nconf.save();

    res.send({ [option]: settings[client][option] });
  } else {
    res.sendStatus(404);
  }
});

app.get('/ipad', async (req, res) => {
  let command;
  if (req.query.lock) command = lockCommand;
  if (req.query.unlock) command = unlockCommand;

  if (command) {
    try {
      await ssh.execCommand(command);

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  } else res.sendStatus(404);
});

app.get('/status', (req, res) => res.send(status));

app.post('/restart', async (req, res) => {
  const result = await restart();

  if (result.code === 0) res.sendStatus(200);
  else res.sendStatus(500);
});

app.get('/crop/:id', async (req, res) => {
  const id = req.params.id;
  const url = req.query.url;

  try {
    if (cropCache[id]) {
      res.send(cropCache[id]);
      return;
    }

    const data = await fetch(url + '=w1200').then((res) => res.buffer());

    const [result] = await visionClient.cropHints({
      image: { content: data },
      imageContext: { cropHintsParams: { aspectRatios: ['1.33'] } },
    });

    const verts = result.cropHintsAnnotation.cropHints[0].boundingPoly.vertices;
    const topLeft = verts[0];

    const cropHints = { top: topLeft.y };
    cropCache[id] = cropHints;

    nconf.set('cropCache', cropCache);
    nconf.save();

    res.send(cropHints);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.post('/crop/:id', async (req, res) => {
  const id = req.params.id;

  const cropHints = { top: Number.parseInt(req.query.top) };
  cropCache[id] = cropHints;

  nconf.set('cropCache', cropCache);
  nconf.save();

  res.send(cropCache[id]);
});

async function authAndCache(url, opts, res, skipCache) {
  if (!REFRESH_TOKEN) {
    res.send(401);
    return;
  }

  const key = url + (opts ? JSON.stringify(opts) : '');
  if (CACHE[key] && !skipCache) {
    res.send(CACHE[key]);
    return;
  }

  try {
    const access_token = (await oauth2Client.getAccessToken()).token;
    const data = await fetch(url, {
      method: opts ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
      body: opts ? JSON.stringify(opts) : undefined,
    });
    const json = await data.json();

    if (url.indexOf('mediaItems:search') !== -1) {
      (json.mediaItems || []).forEach((m, i) => {
        json.mediaItems[i] = {
          baseUrl: m.baseUrl,
          id: m.id,
          mimeType: m.mimeType,
          width: Number.parseInt(m.mediaMetadata.width),
          height: Number.parseInt(m.mediaMetadata.height),
        };
      });
    }

    CACHE[key] = json;
    res.send(json);
  } catch (err) {
    console.error(err);
    res.send(500);
  }
}

async function checkAmbientLight() {
  if (!settings.iPad.ambient || !ssh.isConnected()) return;

  try {
    status.mode = (await ssh.execCommand(getModeCommand)).stdout; // springboard, application, lockscreen

    const remoteFile = '/User/ambient.jpg';
    const localFile = join(__dirname, 'ambient.jpg');

    await ssh.execCommand(`camshot -front ${remoteFile}`);
    await ssh.getFile(localFile, remoteFile);

    new ExifImage({ image: localFile }, async function (error, exifData) {
      if (error) {
        console.error(error.message);
        return;
      }

      status.brightness = exifData.exif.BrightnessValue;
      console.log(`Ambient light level: ${status.brightness.toFixed(4)}`);

      if (status.brightness > cutoff && status.mode === 'lockscreen') await ssh.execCommand(unlockCommand);
      if (status.brightness <= cutoff && status.mode === 'application') await ssh.execCommand(lockCommand);
    });
  } catch (err) {
    console.error(err);
  }
}

async function start() {
  if (!ssh.isConnected()) return 'Not connected';

  console.log(`[${new Date().toLocaleString()}]: Start`);

  lastPing = Date.now() + 60 * 1000;
  const response = await ssh.execCommand(startCommand);
  console.log(`${response.stdout}${response.stderr}`);

  return response;
}

async function restart() {
  if (!ssh.isConnected()) return 'Not connected';

  console.log(`[${new Date().toLocaleString()}]: Restart`);

  lastPing = Date.now() + 60 * 1000;
  const response = await ssh.execCommand(restartCommand);
  console.log(`${response.stdout}${response.stderr}`);

  return response;
}

// Seeded rng: https://stackoverflow.com/a/47593316/2303432
function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}
