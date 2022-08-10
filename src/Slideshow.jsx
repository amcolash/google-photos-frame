import React, { useCallback, useEffect, useState } from 'react';
import { placeholder } from './util';

let overlayTimer;
let shuffleTimer;

export function Slideshow(props) {
  const [overlay, setOverlay] = useState(true);
  const [current, setCurrent] = useState({});
  const [duration, setDuration] = useState(1000 * 5);

  const shuffle = useCallback(() => {
    const items = props.items;
    const random = items[Math.floor(Math.random() * items.length)];
    setCurrent(random);

    shuffleTimer = setTimeout(shuffle, duration);
  }, [props.items, setCurrent]);

  useEffect(shuffle, []);

  useEffect(() => {
    clearTimeout(shuffleTimer);
    shuffleTimer = setTimeout(shuffle, duration);
  }, [shuffle, duration]);

  useEffect(() => {
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => setOverlay(false), 5000);
  }, [setOverlay]);

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
        }}
      >
        <button onClick={() => props.setSlideshow(false)} style={{ color: 'white' }}>
          Back
        </button>
      </div>

      <img
        src={placeholder ? `https://via.placeholder.com/1200?text=${current.id}` : `${current.baseUrl}=s1200-c`}
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
      />
    </div>
  );
}
