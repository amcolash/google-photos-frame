const cors = require('cors');
const express = require('express');
const { google } = require('googleapis');
const nconf = require('nconf');
const { default: fetch } = require('node-fetch');
const { NodeSSH } = require('node-ssh');
const { join } = require('path');
const ExifImage = require('exif').ExifImage;

require('dotenv').config();

nconf.use('file', { file: './settings.json' });
nconf.load();
nconf.save();

let REFRESH_TOKEN = nconf.get('refresh_token');
let settings = nconf.get('settings') || { iPad: { duration: 60 } };

// Update server time for each client
Object.values(settings).forEach((s) => (s.serverTime = Date.now()));

const mockResponse = false;
const port = process.env.PORT || 8500;
const clientUrl = `http://192.168.1.101:${port}`;
let CACHE = {};

const status = { locked: undefined, brightness: undefined };
const cutoff = -4.5;

const lockCommand = 'activator send libactivator.lockscreen.show';
const unlockCommand = 'activator send libactivator.lockscreen.dismiss';

const ssh = new NodeSSH();

// Keep ssh connection alive every minute
setIntervalImmediately(() => {
  if (!ssh.isConnected())
    ssh
      .connect({
        host: process.env.IPAD_IP,
        username: 'mobile',
        password: process.env.IPAD_PASSWORD,
      })
      .then(() => console.log('Connected to server'))
      .catch((err) => console.error(`Error connecting to server\n${err}`));
}, 60 * 1000);

// Clear the cache every 15 minutes
setInterval(() => {
  CACHE = {};
}, 15 * 60 * 1000);

// Check brightness every 20 seconds
setInterval(checkAmbientLight, 20 * 1000);

// check on first load
setTimeout(checkAmbientLight, 6 * 1000);

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = process.env;
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

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
    const scopes = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

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
    res,
    true // for now, always skip cache since we will always need new base photos
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

app.get('/settings/:client/:option', (req, res) => {
  const { client, option } = req.params;

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

async function authAndCache(url, opts, res, skipCache) {
  if (!REFRESH_TOKEN) {
    res.send(401);
    return;
  }

  const access_token = (await oauth2Client.getAccessToken()).token;
  const key = url + (opts ? JSON.stringify(opts) : '');

  if (CACHE[key] && !skipCache) {
    res.send(CACHE[key]);
    return;
  }

  try {
    const data = await fetch(url, {
      method: opts ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
      body: opts ? JSON.stringify(opts) : undefined,
    });
    const json = await data.json();

    if (url.indexOf('mediaItems:search') !== -1) {
      (json.mediaItems || []).forEach((m, i) => {
        json.mediaItems[i] = { baseUrl: m.baseUrl, id: m.id, mimeType: m.mimeType };
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
  if (!settings.iPad.ambient) return;

  try {
    if (status.locked === undefined) {
      await ssh.execCommand(unlockCommand);
      status.locked = false;
    }

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

      if (status.brightness > cutoff && status.locked) {
        status.locked = false;
        await ssh.execCommand(unlockCommand);
      }
      if (status.brightness <= cutoff && !status.locked) {
        status.locked = true;
        await ssh.execCommand(lockCommand);
      }
    });
  } catch (err) {
    console.error(err);
  }
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
