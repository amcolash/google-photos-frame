import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import NoSleep from 'nosleep.js';
import equal from 'fast-deep-equal/es6';

import Back from './img/arrow-left.svg?react';
import Play from './img/play.svg?react';
import Crop from './img/crop.svg?react';

import { Slideshow } from './Slideshow';
import { colors, isIpad, logError, placeholder, SERVER, shuffle, slideshowActive } from './util';
import { usePrevious } from './hooks/usePrevious';
import { Cropper } from './Cropper';

const noSleep = new NoSleep();

const HeaderLeft = (props) =>
  props.headerRef.current ? ReactDOM.createPortal(props.children, props.headerRef.current.querySelector('.left')) : null;

const HeaderRight = (props) =>
  props.headerRef.current ? ReactDOM.createPortal(props.children, props.headerRef.current.querySelector('.right')) : null;

export function Photos(props) {
  const album = props.selectedAlbum;

  const previousAlbum = usePrevious(album);

  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [slideshowItems, setSlideshowItems] = useState();
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let loadMore = true;

    setTimeout(async () => {
      setProgress(Math.min(0.1, 100 / album.mediaItemsCount));

      let page = undefined;
      let allItems = [];
      let index = 1;
      while (loadMore) {
        try {
          const res = await fetch(`${SERVER}/album/${album.id}${page ? `/${page}` : ''}`);
          const data = await res.json();

          page = data.nextPageToken;
          if (!page) loadMore = false;

          // Append new images and filter out non-image content, like videos
          allItems = [...allItems, ...data.mediaItems.filter((i) => i.mimeType.indexOf('image') !== -1)];

          setItems(allItems);
        } catch (err) {
          logError(err);
        }

        setProgress((index * 100) / album.mediaItemsCount);
        index++;
      }

      setProgress(1);

      if (localStorage.getItem(slideshowActive)) {
        const shuffledItems = shuffle([...allItems]);
        setSlideshowItems(shuffledItems);
      }
    });

    const timer = setTimeout(() => setRefreshCounter(refreshCounter + 1), 15 * 60 * 1000);

    return () => {
      if (timer) clearTimeout(timer);
      loadMore = false;
    };
  }, [refreshCounter, setRefreshCounter]);

  useEffect(() => {
    if (!equal(album, previousAlbum)) setRefreshCounter(refreshCounter + 1);
  }, [album, previousAlbum, refreshCounter, setRefreshCounter]);

  useEffect(() => {
    try {
      if (slideshowItems) noSleep.enable();
      else noSleep.disable();
    } catch (err) {
      logError(err);
    }
  }, [slideshowItems]);

  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 2,
          width: `calc(100% * ${progress})`,
          height: '0.25em',
          backgroundColor: colors.theme,
          transition: 'width 1s, opacity 1s 1.5s',
          opacity: progress < 1 ? '1' : '0',
        }}
      />

      {!slideshowItems && (
        <>
          <HeaderLeft headerRef={props.headerRef}>
            <h2 style={{ margin: 0 }}>Photos</h2>
          </HeaderLeft>
          <HeaderRight headerRef={props.headerRef}>
            <button onClick={() => props.setSelectedAlbum()}>
              <Back />
              Back
            </button>
          </HeaderRight>

          <PhotoList album={album} items={items} progress={progress} setSlideshowItems={setSlideshowItems} />
        </>
      )}
      {slideshowItems && (
        <Slideshow
          title={album.title}
          items={slideshowItems}
          setSlideshowItems={setSlideshowItems}
          client={props.client}
          noSleep={noSleep}
          headerRef={props.headerRef}
        />
      )}
    </div>
  );
}

function PhotoList(props) {
  const coverId = props.album.coverPhotoMediaItemId;
  const found = props.items.find((i) => i.id === coverId);
  const coverPhoto = `${SERVER}/image/${props.album.id}?subdir=album_lg&url=${encodeURIComponent(
    (found ? found.baseUrl : props.album.coverPhotoBaseUrl) + '=s128-c'
  )}`;

  const [cropPhoto, setCropPhoto] = useState(false);

  return (
    <div className="photoList">
      <div className="flex align-center">
        <img src={placeholder ? `${SERVER}/image?size=128&id=${props.album.id}` : coverPhoto} style={{ marginRight: '1em' }} />
        <div>
          <h2 style={{ marginTop: 0 }}>
            {props.items.length} photos in "{props.album.title}"
          </h2>
          <button
            onClick={() => {
              const shuffledItems = shuffle([...props.items]);
              props.setSlideshowItems(shuffledItems);
              localStorage.setItem(slideshowActive, true);
            }}
            disabled={props.progress < 1}
            style={isIpad() ? { color: colors.light } : undefined}
          >
            <Play />
            Slideshow
          </button>
          {!isIpad() && (
            <button
              style={{ marginLeft: '1em', background: cropPhoto ? colors.theme : undefined, color: cropPhoto ? colors.light : undefined }}
              onClick={() => {
                setCropPhoto(!cropPhoto);
              }}
            >
              <Crop />
              Crop Photos
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 4em)',
            placeContent: 'flex-start space-between',
            gap: '0.5em',
            marginTop: '2em',
            flex: 1,
          }}
        >
          {props.items.map((i, n) => (
            <button
              key={i.id}
              style={{ padding: 0, border: 'none', background: 'none', outline: cropPhoto === n ? `4px solid ${colors.theme}` : undefined }}
              onClick={() => {
                if (cropPhoto) {
                  setCropPhoto(n);
                } else {
                  const shuffledItems = shuffle([...props.items]).filter((item) => item.id !== i.id);
                  props.setSlideshowItems([i, ...shuffledItems]);
                  localStorage.setItem(slideshowActive, true);
                }
              }}
            >
              <LazyLoadImage
                className="photo"
                src={
                  placeholder
                    ? `${SERVER}/image?size=64&id=${i.id}`
                    : `${SERVER}/image/${i.id}?subdir=thumbnail&url=${encodeURIComponent(`${i.baseUrl}=s64-c`)}`
                }
                height={64}
                width={64}
                placeholder={<span style={{ width: 64, height: 64, backgroundColor: colors.dim }} />}
              />
            </button>
          ))}
        </div>

        <Cropper
          cropPhoto={props.items[cropPhoto] || cropPhoto}
          nextPhoto={() => {
            if (cropPhoto) setCropPhoto((cropPhoto + 1) % props.items.length);
          }}
          progress={(cropPhoto || 0) / props.items.length}
        />
      </div>
    </div>
  );
}
