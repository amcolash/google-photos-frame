const cors = require('cors');
const express = require('express');
const { google } = require('googleapis');
const nconf = require('nconf');
const { default: fetch } = require('node-fetch');

require('dotenv').config();

nconf.use('file', { file: './token.json' });
nconf.load();

let REFRESH_TOKEN = nconf.get('refresh_token');

const clientUrl = 'http://localhost:5173';

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = process.env;
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

const port = process.env.PORT || 3001;
const app = express();
app.use(cors());

let CACHE = {};

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

    res.redirect(clientUrl);

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
  const url = 'https://photoslibrary.googleapis.com/v1/albums?pageSize=50';
  authAndCache(url, undefined, res);
});

app.get('/album/:id/:page?', async (req, res) => {
  const url = `https://photoslibrary.googleapis.com/v1/mediaItems:search`;
  authAndCache(
    url,
    {
      pageSize: '100',
      albumId: req.params.id,
      pageToken: req.params.page,
    },
    res
  );
});

app.get('/status', (req, res) => {
  res.send({ loggedIn: REFRESH_TOKEN !== undefined });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function init() {
  if (REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });
  } else {
    console.error(`No refresh token found, you must authenticate at http://localhost:${port}/oauth before using photos endpoints`);
  }
}

async function authAndCache(url, opts, res) {
  if (!REFRESH_TOKEN) {
    res.send(401);
    return;
  }

  const access_token = (await oauth2Client.getAccessToken()).token;
  const key = url + (opts ? JSON.stringify(opts) : '');

  if (CACHE[key]) {
    res.send(CACHE[key]);
    return;
  }

  const data = await fetch(url, {
    method: opts ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${access_token}` },
    body: opts ? JSON.stringify(opts) : undefined,
  });
  const json = await data.json();

  if (url.indexOf('mediaItems:search') !== -1) {
    json.mediaItems.forEach((m, i) => {
      json.mediaItems[i] = { baseUrl: m.baseUrl, id: m.id };
    });
  }

  CACHE[key] = json;
  res.send(json);
}

init();
