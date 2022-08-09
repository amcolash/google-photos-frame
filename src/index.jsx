import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';

import { initializeApp } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyC5Wn-x5E_G3umM2GvRj2cU_Onyy3fEdzY',
  authDomain: 'photo-frame-21353.firebaseapp.com',
  projectId: 'photo-frame-21353',
  storageBucket: 'photo-frame-21353.appspot.com',
  messagingSenderId: '990708290980',
  appId: '1:990708290980:web:cff403b9ff1a4a4477dd31',

  clientId: '990708290980-7gg7rk84eo8rn3fgmjloth3sk20vl7gk.apps.googleusercontent.com',
};

// Initialize Firebase
initializeApp(firebaseConfig);

ReactDOM.render(<App />, document.getElementById('root'));
