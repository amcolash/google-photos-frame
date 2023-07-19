import React, { useEffect, useRef, useState } from 'react';
import { GoogleLoginButton } from 'react-social-login-buttons';

import { ReactComponent as Clock } from './img/clock.svg';
import { ReactComponent as Power } from './img/power.svg';
import { ReactComponent as Zap } from './img/zap.svg';
import { ReactComponent as ZapOff } from './img/zap-off.svg';

import { Albums } from './Albums';
import { Photos } from './Photos';

import { useSetting } from './hooks/useSetting';
import { SERVER, colors, isIpad } from './util';

export const App = () => {
  const [client, setClient] = useState('iPad');

  const headerRef = useRef();

  const [loggedIn] = useSetting('login', client);
  const [selectedAlbum, setSelectedAlbum] = useSetting('album', client);
  const [ambientMode, setAmbientMode] = useSetting('ambient', client, true);
  const [serverTime, setServerTime, prevServerTime] = useSetting('serverTime', client);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (prevServerTime !== undefined && serverTime !== prevServerTime) window.location.reload();
  }, [serverTime, prevServerTime]);

  if (loggedIn)
    return (
      <div>
        <div
          className="inverse header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1.25em',
            background: colors.dim,
            zIndex: 1,
            position: 'relative',
            transition: 'opacity 0.5s',
          }}
          ref={headerRef}
        >
          <div className="left" style={{ display: 'flex', alignItems: 'center' }} />

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!isIpad() && (
              <button
                onClick={async () => {
                  setRestarting(true);
                  await fetch(`${SERVER}/restart`, { method: 'POST' });
                  setRestarting(false);
                }}
                style={{ padding: '0.45em', marginRight: '1em' }}
              >
                {restarting ? (
                  <div className="lds-ring">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                ) : (
                  <Power style={{ marginRight: 0 }} />
                )}
              </button>
            )}
            <button onClick={() => setServerTime(Date.now())} style={{ padding: '0.45em', marginRight: '1em' }}>
              <Clock style={{ marginRight: 0 }} />
            </button>
            <button onClick={() => setAmbientMode(!ambientMode)} style={{ padding: '0.45em', marginRight: '2em' }}>
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
