import React, { useState } from 'react';
import { GoogleLoginButton } from 'react-social-login-buttons';

import { ReactComponent as Logout } from './img/log-out.svg';
import { ReactComponent as Zap } from './img/zap.svg';
import { ReactComponent as ZapOff } from './img/zap-off.svg';

import { Albums } from './Albums';
import { Photos } from './Photos';

import { useSetting } from './hooks/useSetting';
import { SERVER, colors } from './util';

export const App = () => {
  const [client, setClient] = useState('iPad');

  const [loggedIn] = useSetting('login', client);
  const [selectedAlbum, setSelectedAlbum] = useSetting('album', client);
  const [ambientMode, setAmbientMode] = useSetting('ambient', client, true);

  if (loggedIn)
    return (
      <div>
        <div
          className="inverse"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1em',
            background: colors.border,
          }}
        >
          <h2 style={{ margin: 0 }}>{!selectedAlbum ? 'Albums' : 'Photos'}</h2>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setAmbientMode(!ambientMode)} style={{ padding: '0.35em', marginRight: '1em' }}>
              {ambientMode ? <Zap style={{ marginRight: 0 }} /> : <ZapOff style={{ marginRight: 0 }} />}
            </button>

            <div style={{ margin: '0.5em 0.75em' }}>{client}</div>
            <button
              onClick={() => {
                location.href = `${SERVER}/oauth?logout=true&redirect=${location.href}`;
              }}
            >
              <Logout />
              Logout
            </button>
          </div>
        </div>

        <div style={{ margin: '1em' }}>
          {!selectedAlbum && <Albums setSelectedAlbum={setSelectedAlbum} />}
          {selectedAlbum && <Photos selectedAlbum={selectedAlbum} setSelectedAlbum={setSelectedAlbum} client={client} />}
        </div>
      </div>
    );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Photo Frame</h2>
        {loggedIn === false && <GoogleLoginButton onClick={() => (location.href = `${SERVER}/oauth`)} style={{ width: '12em' }} />}
        {loggedIn === undefined && <h3>Loading...</h3>}
      </div>
    </div>
  );
};
