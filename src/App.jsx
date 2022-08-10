import React, { useState } from 'react';
import { useEffect } from 'react';
import { GoogleLoginButton } from 'react-social-login-buttons';

import { Albums } from './Albums';
import { Photos } from './Photos';
import { selectedAlbumName, SERVER } from './util';

export const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  const selected = localStorage.getItem(selectedAlbumName);
  const [selectedAlbum, setSelectedAlbum] = useState(selected ? JSON.parse(selected) : undefined);

  useEffect(() => {
    fetch(`${SERVER}/status`)
      .then((res) => res.json())
      .then((data) => setLoggedIn(data.loggedIn));
  }, []);

  useEffect(() => {
    if (selectedAlbum) localStorage.setItem(selectedAlbumName, JSON.stringify(selectedAlbum));
    else localStorage.removeItem(selectedAlbumName);
  }, [selectedAlbum, setSelectedAlbum]);

  if (loggedIn)
    return (
      <div style={{ margin: '1em' }}>
        <div style={{ textAlign: 'right' }}>
          <button onClick={() => (location.href = `${SERVER}/oauth?logout=true`)}>Logout</button>
        </div>
        {!selectedAlbum && <Albums setSelectedAlbum={setSelectedAlbum} />}
        {selectedAlbum && <Photos selectedAlbum={selectedAlbum} setSelectedAlbum={setSelectedAlbum} />}
      </div>
    );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Photo Frame</h2>
        <GoogleLoginButton onClick={() => (location.href = `${SERVER}/oauth`)} style={{ width: '12em' }} />
      </div>
    </div>
  );
};
