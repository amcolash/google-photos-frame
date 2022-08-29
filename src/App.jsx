import React, { useState } from 'react';
import { GoogleLoginButton } from 'react-social-login-buttons';

import { Albums } from './Albums';
import { Photos } from './Photos';

import { useSetting } from './hooks/useSetting';
import { SERVER } from './util';

export const App = () => {
  const [client, setClient] = useState('iPad');

  const [loggedIn] = useSetting('login', client);
  const [selectedAlbum, setSelectedAlbum] = useSetting('album', client);

  if (loggedIn)
    return (
      <div style={{ margin: '1em' }}>
        {!selectedAlbum && (
          <div>
            <div style={{ position: 'absolute', top: '1em', right: '1em', display: 'flex', alignItems: 'center' }}>
              <div style={{ marginRight: '1em' }}>{client}</div>
              <button
                onClick={() => {
                  location.href = `${SERVER}/oauth?logout=true&redirect=${location.href}`;
                }}
              >
                Logout
              </button>
            </div>
            <Albums setSelectedAlbum={setSelectedAlbum} />
          </div>
        )}
        {selectedAlbum && <Photos selectedAlbum={selectedAlbum} setSelectedAlbum={setSelectedAlbum} client={client} />}
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
