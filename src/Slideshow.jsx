import React, { useEffect, useState } from 'react';

import { useSetting } from './hooks/useSetting';
import { placeholder, SERVER, slideshowActive } from './util';

let overlayTimer;
let shuffleTimer;

export function Slideshow(props) {
  const [overlay, setOverlay] = useState(true);
  const [current, setCurrent] = useState(0);

  const [duration, setDuration] = useSetting('duration', props.client, 60);

  useEffect(() => {
    clearTimeout(shuffleTimer);
    shuffleTimer = setTimeout(() => setCurrent((current + 1) % props.items.length), duration * 1000);
  }, [current, duration, setCurrent, props.items]);

  useEffect(() => {
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => setOverlay(false), 5000);
  }, [duration, overlay, setOverlay]);

  const photo = props.items[current] || {};

  const min = Math.floor(duration / 60);
  const sec = Math.floor(duration - min * 60)
    .toString()
    .padStart(2, '0');

  return (
    <div onClick={() => setOverlay(true)}>
      <div
        style={{
          position: 'absolute',
          top: '1em',
          left: '1em',
          zIndex: 1,
          opacity: overlay ? 1 : 0,
          pointerEvents: overlay ? undefined : 'none',
          transition: 'opacity 1s',
          background: '#eee',
          padding: '1em',
        }}
      >
        <button
          onClick={() => {
            props.setSlideshowItems();
            localStorage.removeItem(slideshowActive);
          }}
        >
          Back
        </button>
        <div style={{ marginTop: '1em' }}>
          <input type="range" value={duration} min={5} max={5 * 60} step={5} onChange={(e) => setDuration(e.target.value)} />
          <div>
            Image Duration {min}:{sec}
          </div>
          {!props.noSleep.isEnabled && <div>NoSleep Disabled</div>}
        </div>
      </div>

      <img
        src={placeholder ? `${SERVER}/image?size=1200&id=${photo.id}` : `${photo.baseUrl}=s1200-c`}
        style={{
          width: '100vw',
          height: '100vh',
          borderRadius: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          objectFit: 'contain',
          background: 'black',
        }}
        onError={(e) => {
          console.error(e);
          setCurrent((current + 1) % props.items.length || 0);
        }}
      />
    </div>
  );
}
