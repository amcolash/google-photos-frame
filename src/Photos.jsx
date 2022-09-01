import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import NoSleep from 'nosleep.js';
import equal from 'fast-deep-equal/es6';

import { ReactComponent as Back } from './img/arrow-left.svg';
import { ReactComponent as Play } from './img/play.svg';

import { Slideshow } from './Slideshow';
import { colors, placeholder, SERVER, shuffle, slideshowActive } from './util';
import { usePrevious } from './hooks/usePrevious';

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
        const res = await fetch(`${SERVER}/album/${album.id}${page ? `/${page}` : ''}`);
        const data = await res.json();

        page = data.nextPageToken;
        if (!page) loadMore = false;

        // Append new images and filter out non-image content, like videos
        allItems = [...allItems, ...data.mediaItems.filter((i) => i.mimeType.indexOf('image') !== -1)];

        setItems(allItems);
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
    if (slideshowItems) noSleep.enable();
    else noSleep.disable();
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
  const coverPhoto = (props.items.find((i) => i.id === coverId) || { baseUrl: props.album.coverPhotoBaseUrl }).baseUrl;

  return (
    <div className="photoList">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={placeholder ? `${SERVER}/image?size=128&id=${props.album.id}` : `${coverPhoto}=s128-c`} style={{ marginRight: '1em' }} />
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
          >
            <Play />
            Slideshow
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 4em)',
          placeContent: 'flex-start space-between',
          gap: '0.5em',
          marginTop: '2em',
        }}
      >
        {props.items.map((i) => (
          <button
            key={i.id}
            style={{ padding: 0, border: 'none', background: 'none' }}
            onClick={() => {
              const shuffledItems = shuffle([...props.items]).filter((item) => item.id !== i.id);
              props.setSlideshowItems([i, ...shuffledItems]);
              localStorage.setItem(slideshowActive, true);
            }}
          >
            <LazyLoadImage
              className="photo"
              src={placeholder ? `${SERVER}/image?size=64&id=${i.id}` : `${i.baseUrl}=s64-c`}
              threshold={1000}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
