import React, { useEffect, useState } from 'react';

import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

export function Albums(props) {
  const auth = getAuth(getApp());
  const [user] = useAuthState(auth);

  const [albums, setAlbums] = useState([]);

  // useEffect(() => {
  //   fetch('https://photoslibrary.googleapis.com/v1/albums', {
  //     headers: { Authentication: `Bearer ${user.accessToken}` },
  //   })
  //     .then((res) => res.json())
  //     .then((date) => {
  //       console.log(data);
  //     });
  // }, []);

  return (
    <div>
      {albums.map((a) => (
        <div>{JSON.stringify(a)}</div>
      ))}
    </div>
  );
}
