import React, { useEffect, useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import Photos from 'googlephotos';

export default () => {
  const [accessToken, setAccessToken] = useState();

  useEffect(async () => {
    const photos = new Photos(token);
    const response = await photos.albums.list();

    console.log(response);
  }, [accessToken]);

  useEffect(() => {
    const auth = getAuth();

    auth.onAuthStateChanged((user) => {
      console.log(user);

      if (user.refreshToken) {
        user
          .getIdToken(true)
          .then(function (idToken) {
            setAccessToken(idToken);
          })
          .catch(function (error) {
            console.error(error);
          });
      } else {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/photoslibrary.readonly');

        signInWithPopup(auth, provider)
          .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            // ...

            setAccessToken(user.accessToken);
          })
          .catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...

            console.error(errorCode, errorMessage);
          });
      }
    });
  }, []);

  return (
    <>
      <h1>Welcome to React Vite Micro App!</h1>
      <p>Hard to get more minimal than this React app.</p>
    </>
  );
};
