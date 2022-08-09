import React, { useState } from 'react';

import { getApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

import { Albums } from './Albums';
import { Auth } from './Auth';

import { albumKey } from './util';

export const App = () => {
  const auth = getAuth(getApp());
  const [user] = useAuthState(auth);

  const [selectedAlbum, setSelectedAlbum] = useState(localStorage.getItem(albumKey));

  if (!user) return <Auth />;
  else
    return (
      <div>
        <div>Now we are logged in!</div>
        <button onClick={() => signOut(auth)}>Sign Out</button>

        <pre>{JSON.stringify(user, undefined, 2)}</pre>

        {!selectedAlbum && <Albums setSelectedAlbum={setSelectedAlbum} />}
      </div>
    );
};
