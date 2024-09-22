import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import Back from './img/arrow-left.svg?react';
import Crop from './img/crop.svg?react';
import ArrowRight from './img/arrow-right.svg?react';

import { useSetting } from './hooks/useSetting';
import { colors, imageWidth, ipadHeight, ipadWidth, isIpad, logError, placeholder, SERVER, slideshowActive } from './util';

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
  const [imageDims, setImageDims] = useState({});
  const [cropBounds, setCropBounds] = useState({});

  const [duration, setDuration] = useSetting('duration', props.client, 60);
  const [crop, setCrop] = useSetting('crop', props.client, false);

  const fetchCrop = useCallback(
    async (item) => {
      if (item && !cropBounds[item.id]) {
        await fetch(`${SERVER}/crop/${item.id}?url=${item.baseUrl}`)
          .then((res) => res.json())
          .then((data) => {
            setCropBounds((prev) => {
              return { ...prev, [item.id]: data };
            });
          })
          .catch((err) => logError(err));
      }
    },
    [cropBounds]
  );

  useEffect(() => {
    clearTimeout(shuffleTimer);
    shuffleTimer = setTimeout(() => setCurrent((prev) => (prev + 1) % props.items.length), duration * 1000);
  }, [duration, current, props.items]);

  useEffect(() => {
    const currentItem = props.items[current];

    fetchCrop(currentItem);

    if (!imageDims[currentItem.id]) {
      const img = new Image();
      img.src = placeholder
        ? `${SERVER}/image?size=1200&id=${currentItem.id}`
        : `${SERVER}/image/${currentItem.id}?subdir=image&url=${encodeURIComponent(`${currentItem.baseUrl}=w${imageWidth}`)}`;

      img.onload = () =>
        setImageDims((prev) => {
          return { ...prev, [currentItem.id]: { width: img.width, height: img.height } };
        });
      img.onerror = () => setCurrent((prev) => (prev + 1) % props.items.length);
    }

    // Preload the next image + crop bounds to try and prevent errors
    clearTimeout(loadTimer);
    loadTimer = setTimeout(
      () => {
        const next = props.items[(current + 1) % props.items.length];

        if (next) {
          const nextImg = new Image();
          nextImg.src = placeholder
            ? `${SERVER}/image?size=1200&id=${next.id}`
            : `${SERVER}/image/${next.id}?subdir=image&url=${encodeURIComponent(`${next.baseUrl}=w${imageWidth}`)}`;

          next.onload = () =>
            setImageDims((prev) => {
              return { ...prev, [next.id]: { width: next.width, height: next.height } };
            });

          fetchCrop(next);
        }
      },
      isIpad() ? 3000 : 1000
    );
  }, [current, props.items, fetchCrop]);

  useEffect(() => {
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => setOverlay(false), 5000);
  }, [overlay]);

  useEffect(() => {
    if (props.headerRef.current) props.headerRef.current.style.opacity = overlay ? 0.85 : 0;
  }, [overlay, props.headerRef]);

  const photo = props.items[current] || {};
  const imageUrl = placeholder
    ? `${SERVER}/image?size=1200&id=${photo.id}`
    : `${SERVER}/image/${photo.id}?subdir=image&url=${encodeURIComponent(`${photo.baseUrl}=w${imageWidth}`)}`;

  const min = Math.floor(duration / 60);
  const sec = Math.floor(duration - min * 60)
    .toString()
    .padStart(2, '0');

  let cropCenter;
  if (crop && cropBounds[photo.id]) {
    // 4:3 ratio crop size always used, so height is always the same
    // const height = 1200 * (4 / 3);

    cropCenter = {
      // y: ((cropBounds[photo.id].top + height / 2) / height) * 100,
      y: cropBounds[photo.id].top,
    };
  }

  return (
    <div
      onClick={(e) => {
        if (!overlay) {
          setOverlay(true);
          try {
            props.noSleep.enable();
          } catch (err) {
            logError(err);
          }
        }
      }}
    >
      <HeaderLeft headerRef={props.headerRef}>
        <h2 style={{ margin: 0 }}>{props.title} Slideshow</h2>
      </HeaderLeft>
      <HeaderRight headerRef={props.headerRef}>
        <div className="flex align-center">
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
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
          {/* Background blur layer */}
          {!crop && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'black',
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(2em)',
                zIndex: -1,
                transform: imageDims[photo.id]?.height > imageDims[photo.id]?.width ? 'scaleX(2)' : 'scaleY(2)',
                transformOrigin: 'left',
              }}
            />
          )}

          {/* Top normal layer */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: crop ? `${(imageWidth / ipadWidth) * 100}%` : 'contain',
              backgroundPosition: cropCenter && imageDims[photo.id]?.height > ipadHeight ? `center top -${cropCenter.y}px` : 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '1em',
          right: '1em',
          color: 'white',
          textShadow: '0 0 0.5em black',
          opacity: overlay ? 1 : 0,
          transition: 'opacity 0.5s',
        }}
      >
        <button
          style={{ color: colors.light, border: 'none', background: 'none' }}
          onClick={() => setCurrent((prev) => (((prev - 1) % props.items.length) + props.items.length) % props.items.length)}
        >
          <Back />
        </button>
        <button
          style={{ color: colors.light, border: 'none', background: 'none' }}
          onClick={() => setCurrent((prev) => (prev + 1) % props.items.length)}
        >
          <ArrowRight />
        </button>
        <span>
          {current + 1} / {props.items.length}
        </span>
      </div>
    </div>
  );
}
