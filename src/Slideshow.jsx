import React, { useEffect, useState } from 'react';
import { placeholder, SERVER, shuffle } from './util';

let overlayTimer;
let shuffleTimer;

export function Slideshow(props) {
  const [overlay, setOverlay] = useState(true);
  const [duration, setDuration] = useState(1000 * 5);

  const [current, setCurrent] = useState(0);
  const [shuffledList, setShuffledList] = useState([]);

  useEffect(() => {
    const shuffled = [...props.items];
    shuffle(shuffled);
    setShuffledList(shuffled);
  }, []);

  useEffect(() => {
    clearTimeout(shuffleTimer);
    shuffleTimer = setTimeout(() => setCurrent((current + 1) % shuffledList.length), duration);
  }, [current, duration, setCurrent, shuffledList]);

  useEffect(() => {
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => setOverlay(false), 5000);
  }, [setOverlay]);

  const photo = shuffledList[current] || {};

  return (
    <div onClick={() => setOverlay(true)} style={{ cursor: overlay ? undefined : 'none' }}>
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
      />
    </div>
  );
}
