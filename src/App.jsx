import React, { useRef, useState } from 'react';
import { GoogleLoginButton } from 'react-social-login-buttons';

import { ReactComponent as Zap } from './img/zap.svg';
import { ReactComponent as ZapOff } from './img/zap-off.svg';

import { Albums } from './Albums';
import { Photos } from './Photos';

import { useSetting } from './hooks/useSetting';
import { SERVER, colors } from './util';

export const App = () => {
  const [client, setClient] = useState('iPad');

  const headerRef = useRef();

  const [loggedIn] = useSetting('login', client);
  const [selectedAlbum, setSelectedAlbum] = useSetting('album', client);
  const [ambientMode, setAmbientMode] = useSetting('ambient', client, true);
  const [serverTime] = useSetting('serverTime', client);

  if (loggedIn)
    return (
      <div>
        <div
          className="inverse header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1.25em',
            background: colors.border,
            zIndex: 1,
            position: 'relative',
            transition: 'opacity 0.5s',
          }}
          ref={headerRef}
        >
          <div className="left" style={{ display: 'flex', alignItems: 'center' }} />

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setAmbientMode(!ambientMode)} style={{ padding: '0.45em', margin: '0 1.5em' }}>
              {ambientMode ? <Zap style={{ marginRight: 0 }} /> : <ZapOff style={{ marginRight: 0 }} />}
            </button>
            <div className="right" style={{ display: 'flex', alignItems: 'center' }} />
          </div>
        </div>

        <div style={{ margin: '1.5em' }}>
          {!selectedAlbum && <Albums setSelectedAlbum={setSelectedAlbum} client={client} headerRef={headerRef} />}
          {selectedAlbum && (
            <Photos selectedAlbum={selectedAlbum} setSelectedAlbum={setSelectedAlbum} client={client} headerRef={headerRef} />
          )}
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
