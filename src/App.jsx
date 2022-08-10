import React, { useState } from 'react';
import { useEffect } from 'react';
import { GoogleLoginButton } from 'react-social-login-buttons';

import { Albums } from './Albums';
import { Photos } from './Photos';
import { Slideshow } from './Slideshow';
import { selectedAlbumName, SERVER } from './util';

export const App = () => {
  const selected = localStorage.getItem(selectedAlbumName);

  const [loggedIn, setLoggedIn] = useState(undefined);
  const [selectedAlbum, setSelectedAlbum] = useState(selected ? JSON.parse(selected) : undefined);
  const [slideshow, setSlideshow] = useState(false);

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
        <button onClick={() => (location.href = `${SERVER}/oauth?logout=true`)} style={{ position: 'absolute', top: '1em', right: '1em' }}>
          Logout
        </button>
        {!selectedAlbum && <Albums setSelectedAlbum={setSelectedAlbum} />}
        {selectedAlbum && !slideshow && (
          <Photos selectedAlbum={selectedAlbum} setSelectedAlbum={setSelectedAlbum} setSlideshow={setSlideshow} />
        )}
        {selectedAlbum && slideshow && <Slideshow setSlideshow={setSlideshow} />}
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
