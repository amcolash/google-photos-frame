import React from 'react';

import { getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuthState, useSignInWithGoogle } from 'react-firebase-hooks/auth';

export function Auth() {
  const auth = getAuth(getApp());

  const [user, loading, error] = useAuthState(auth);
  const [signInWithGoogle, googleUser] = useSignInWithGoogle(auth);

  console.log('user', user, 'googleUser', googleUser);

  if (loading) {
    return (
      <div>
        <p>Initializing User...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        // signInWithGoogle([
        //   'https://www.googleapis.com/auth/photoslibrary.readonly',
        //   'https://www.googleapis.com/auth/userinfo.profile',
        // ]).then((value) => {
        //   console.log(value);
        // })

        const provider = new GoogleAuthProvider(auth);
        provider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');
        signInWithPopup(auth, provider).then((value) => console.log(value));
      }}
    >
      Log in
    </button>
  );
}
