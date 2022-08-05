const { google } = require('googleapis');
const Photos = require('googlephotos');

require('dotenv').config();

const { CLIENT_CODE, CLIENT_ID, CLIENT_SECRET, REDIRECT_URL, REFRESH_TOKEN } = process.env;
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
let token;

const photos = new Photos(token);
const express = require('express');

const port = process.env.PORT || 3001;
const app = express();

app.get('/oauth', (req, res) => {
  if (req.query.code) {
    res.send(req.query);
  } else {
    // generate a url that asks permissions for Blogger and Google Calendar scopes
    const scopes = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

    const url = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',

      // If you only need one scope you can pass it as a string
      scope: scopes,
    });

    res.redirect(url);
  }
});

app.get('/photos', async (req, res) => {
  if (token) {
    const response = await photos.albums.list();

    res.send(response);
  } else {
    res.send(401);
  }
});

google.app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function init() {
  if (REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });
  } else if (CLIENT_CODE) {
    try {
      const { tokens } = await oauth2Client.getToken(CLIENT_CODE);
      oauth2Client.setCredentials(tokens);
    } catch (e) {
      console.error(e);
    }
  }

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      console.log('refresh', tokens.refresh_token);
    }

    console.log('access', tokens.access_token);
  });
}

init();
