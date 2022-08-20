import React, { useEffect, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import NoSleep from 'nosleep.js';

import { Slideshow } from './Slideshow';
import { placeholder, SERVER, shuffle, slideshowActive, themeColor } from './util';

const noSleep = new NoSleep();

export function Photos(props) {
  const album = props.selectedAlbum;

  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [slideshowItems, setSlideshowItems] = useState();
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    console.log('Refreshing Images');

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

    const timer = setTimeout(() => setRefreshCounter(refreshCounter + 1), 30 * 60 * 1000);

    return () => {
      if (timer) clearTimeout(timer);
      loadMore = false;
    };
  }, [refreshCounter, setRefreshCounter]);

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
          width: `calc(100% * ${progress})`,
          height: '0.25em',
          backgroundColor: themeColor,
          transition: 'width 1s, opacity 1s 1.5s',
          opacity: progress < 1 ? '1' : '0',
        }}
      />

      {!slideshowItems && (
        <PhotoList
          album={album}
          items={items}
          progress={progress}
          setSelectedAlbum={props.setSelectedAlbum}
          setSlideshowItems={setSlideshowItems}
        />
      )}
      {slideshowItems && <Slideshow items={slideshowItems} setSlideshowItems={setSlideshowItems} client={props.client} />}
    </div>
  );
}

function PhotoList(props) {
  const coverId = props.album.coverPhotoMediaItemId;
  const coverPhoto = (props.items.find((i) => i.id === coverId) || { baseUrl: props.album.coverPhotoBaseUrl }).baseUrl;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={placeholder ? `${SERVER}/image?size=128&id=${props.album.id}` : `${coverPhoto}=s128-c`}
          style={{ margin: '1em', marginLeft: 0 }}
        />
        <div>
          <h2 style={{ marginTop: 0 }}>
            {props.items.length} photos in "{props.album.title}"
          </h2>
          <button onClick={() => props.setSelectedAlbum()} style={{ marginRight: '0.75em' }}>
            Back
          </button>
          <button
            onClick={() => {
              const shuffledItems = shuffle([...props.items]);
              props.setSlideshowItems(shuffledItems);
              localStorage.setItem(slideshowActive, true);
            }}
            disabled={props.progress < 1}
          >
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
            <LazyLoadImage src={placeholder ? `${SERVER}/image?size=64&id=${i.id}` : `${i.baseUrl}=s64-c`} threshold={1000} />
          </button>
        ))}
      </div>
    </div>
  );
}
