import React from 'react';
import ReactDOM from 'react-dom';

// Polyfill fetch
import 'whatwg-fetch';

import './loading.css';
import { App } from './App';
import { colors, isIpad } from './util';

if (isIpad()) {
  document.body.style.background = colors.dark;
  document.body.style.color = colors.light;
}

ReactDOM.render(<App />, document.getElementById('root'));
