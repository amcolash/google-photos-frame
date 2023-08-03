import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import { ReactComponent as Back } from './img/arrow-left.svg';
import { ReactComponent as Crop } from './img/crop.svg';

import { useSetting } from './hooks/useSetting';
import { logError, placeholder, SERVER, slideshowActive } from './util';

let overlayTimer;
let shuffleTimer;
let loadTimer;

const HeaderLeft = (props) =>
  props.headerRef.current ? ReactDOM.createPortal(props.children, props.headerRef.current.querySelector('.left')) : null;

const HeaderRight = (props) =>
  props.headerRef.current ? ReactDOM.createPortal(props.children, props.headerRef.current.querySelector('.right')) : null;

export function Slideshow(props) {
  const [overlay, setOverlay] = useState(true);
  const [current, setCurrent] = useState(0);
  const [cropBounds, setCropBounds] = useState({});

  const [duration, setDuration] = useSetting('duration', props.client, 60);
  const [crop, setCrop] = useSetting('crop', props.client, false);

  const fetchCrop = useCallback(
    async (item) => {
      if (item && !cropBounds[item.id]) {
        await fetch(`${SERVER}/crop/${item.id}?url=${item.baseUrl}`)
          .then((res) => res.json())
          .then((data) => {
            setCropBounds({ ...cropBounds, [item.id]: data });
          })
          .catch((err) => logError(err));
      }
    },
    [cropBounds]
  );

  useEffect(() => {
    clearTimeout(shuffleTimer);
    shuffleTimer = setTimeout(() => setCurrent(((current || 0) + 1) % props.items.length), duration * 1000);
  }, [current, duration, props.items]);

  useEffect(() => {
    fetchCrop(props.items[current]);

    // Preload the next image + crop bounds to try and prevent errors
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => {
      const next = props.items[(current + 1) % props.items.length];

      if (next) {
        const nextImg = new Image();
        nextImg.src = placeholder ? `${SERVER}/image?size=1200&id=${next.id}` : `${next.baseUrl}=s1200-c`;

        fetchCrop(next);
      }
    }, 5000);
  }, [current, props.items, fetchCrop]);

  useEffect(() => {
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => setOverlay(false), 5000);
  }, [duration, overlay, setOverlay]);

  useEffect(() => {
    if (props.headerRef.current) {
      props.headerRef.current.style.opacity = overlay ? 1 : 0;
      props.headerRef.current.style.pointerEvents = overlay ? 'unset' : 'none';
    }
  }, [overlay, props.headerRef]);

  const photo = props.items[current] || {};
  const imageUrl = placeholder ? `${SERVER}/image?size=1200&id=${photo.id}` : `${photo.baseUrl}=s1200-c`;

  const min = Math.floor(duration / 60);
  const sec = Math.floor(duration - min * 60)
    .toString()
    .padStart(2, '0');

  let cropCenter;
  if (crop && cropBounds[photo.id]) {
    // Calculate the center of the crop bounds as a percentage of the image size
    const { top, left, width, height } = cropBounds[photo.id];

    const scale = 1200 / Math.max(photo.width, photo.height);
    const scaledWidth = photo.width * scale;
    const scaledHeight = photo.height * scale;
    cropCenter = {
      x: ((left + width / 2) / scaledWidth) * 100,
      y: ((top + height / 2) / scaledHeight) * 100,
    };
  }

  return (
    <div
      onClick={() => {
        setOverlay(true);
        try {
          props.noSleep.enable();
        } catch (err) {
          logError(err);
        }
      }}
    >
      <HeaderLeft headerRef={props.headerRef}>
        <h2 style={{ margin: 0 }}>{props.title} Slideshow</h2>
      </HeaderLeft>
      <HeaderRight headerRef={props.headerRef}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setCrop(!crop)} style={{ marginRight: '1.5em' }}>
            <Crop /> {crop ? '✓' : 'x'}
          </button>
          <span style={{ whiteSpace: 'nowrap' }}>
            Duration {min}:{sec}
          </span>
          <input
            type="range"
            value={duration}
            min={5}
            max={5 * 60}
            step={5}
            onChange={(e) => setDuration(e.target.value)}
            style={{ marginLeft: '1em', marginTop: 0 }}
          />
          {!props.noSleep.isEnabled && <div>NoSleep Disabled</div>}
          <button
            onClick={() => {
              props.setSlideshowItems();
              localStorage.removeItem(slideshowActive);
            }}
            style={{ marginLeft: '1.5em' }}
          >
            <Back />
            Back
          </button>
        </div>
      </HeaderRight>

      {(photo.id || placeholder) && (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'black',
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: crop ? 'cover' : 'contain',
            backgroundPosition: cropCenter ? `left ${cropCenter.x}% top ${cropCenter.y}%` : 'center',
            backgroundRepeat: 'no-repeat',
          }}
          // onError={(e) => {
          //   logError(e);
          //   setTimeout(() => setCurrent((current + 1) % props.items.length || 0), 250);
          // }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '1em',
          right: '1em',
          color: 'white',
          textShadow: '0 0 0.35em black',
          opacity: overlay ? 1 : 0,
          transition: 'opacity 0.5s',
        }}
      >
        {current + 1} / {props.items.length}
      </div>
    </div>
  );
}
