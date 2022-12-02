import React from 'react';
import ReactDOM from 'react-dom';

// Polyfill fetch
import 'whatwg-fetch';

import './loading.css';
import { App } from './App';

ReactDOM.render(<App />, document.getElementById('root'));
