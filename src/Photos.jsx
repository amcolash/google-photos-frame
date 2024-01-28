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

    // Keep track of loading and cancel if it takes too long
    const timer = setTimeout(() => {
      loadMore = false;
      setProgress(0);
      setTimeout(() => setRefreshCounter((prev) => prev + 1), 1000);
    }, 30 * 1000);
    setProgress(Math.min(0.02, 100 / album.mediaItemsCount));

    if (isIpad()) {
      setTimeout(async () => {
        let allItems = [];

        try {
          const res = await fetch(`${SERVER}/album_full/${album.id}`);
          const data = await res.json();

          allItems = data.mediaItems.filter((i) => i.mimeType.indexOf('image') !== -1);
          setItems(allItems);
        } catch (err) {
          logError(err);
        }

        if (timer) clearTimeout(timer);
        setProgress(1);

        if (localStorage.getItem(slideshowActive)) {
          const shuffledItems = shuffle([...allItems]);
          setSlideshowItems(shuffledItems);
        }
      });
    } else {
      // Using a timeout so we can use async/await
      setTimeout(async () => {
        let page = undefined;
        let allItems = [];
        let index = 1;
        while (loadMore) {
          try {
            const res = await fetch(`${SERVER}/album/${album.id}${page ? `/${page}` : ''}`);

            if (loadMore) {
              const data = await res.json();

              page = data.nextPageToken;
              if (!page) loadMore = false;

              // Append new images and filter out non-image content, like videos
              allItems = [...allItems, ...data.mediaItems.filter((i) => i.mimeType.indexOf('image') !== -1)];

              setItems(allItems);
            }
          } catch (err) {
            logError(err);
            loadMore = false;
          }

          setProgress((index * 100) / album.mediaItemsCount);
          index++;
        }

        if (timer) clearTimeout(timer);
        setProgress(1);

        if (localStorage.getItem(slideshowActive)) {
          const shuffledItems = shuffle([...allItems]);
          setSlideshowItems(shuffledItems);
        }
      }, 0);
    }

    () => {
      if (timer) clearTimeout(timer);
    };
  }, [refreshCounter, setRefreshCounter]);

  useEffect(() => {
    if (previousAlbum && album && !equal(album, previousAlbum)) {
      setRefreshCounter((prev) => prev + 1);
    }
  }, [album, previousAlbum, setRefreshCounter]);

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
  const [hidePhotos, setHidePhotos] = useState(isIpad());

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
          {isIpad() && (
            <button onClick={() => setHidePhotos(!hidePhotos)} style={{ color: colors.light, marginLeft: '1em' }}>
              {hidePhotos ? 'Show Photos' : 'Hide Photos'}
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
                if (cropPhoto !== false) {
                  setCropPhoto(n);
                } else {
                  const shuffledItems = shuffle([...props.items]).filter((item) => item.id !== i.id);
                  props.setSlideshowItems([i, ...shuffledItems]);
                  localStorage.setItem(slideshowActive, true);
                }
              }}
            >
              {!hidePhotos && (props.progress === 1 || n < 50) && (
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
              )}
            </button>
          ))}
        </div>

        <Cropper
          cropPhoto={props.items[cropPhoto] || cropPhoto}
          nextPhoto={() => {
            if (cropPhoto) setCropPhoto((cropPhoto + 1) % props.items.length);
          }}
          previousPhoto={() => {
            if (cropPhoto) setCropPhoto(Math.max(0, cropPhoto - 1));
          }}
          progress={(cropPhoto || 0) / props.items.length}
          close={() => setCropPhoto(false)}
        />
      </div>
    </div>
  );
}
