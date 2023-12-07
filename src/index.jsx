import React from 'react';
import { createRoot } from 'react-dom/client';

// Polyfill fetch
import 'whatwg-fetch';

import './loading.css';
import { App } from './App';
import { colors, isIpad } from './util';

if (isIpad()) {
  document.body.style.background = colors.dark;
  document.body.style.color = colors.light;
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
