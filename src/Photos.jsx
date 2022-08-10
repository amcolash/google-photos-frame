import React, { useEffect, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import { placeholder, SERVER, themeColor } from './util';

export function Photos(props) {
  const album = props.selectedAlbum;

  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);

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
        allItems = [...allItems, ...data.mediaItems];

        setItems(allItems);
        setProgress((index * 100) / album.mediaItemsCount);

        index++;
      }

      setProgress(1);
    });

    return () => {
      loadMore = false;
    };
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={placeholder ? 'https://via.placeholder.com/128' : `${album.coverPhotoBaseUrl}=w128-h128-c`}
          style={{ margin: '1em', marginLeft: 0 }}
        />
        <div>
          <h2>
            {album.mediaItemsCount} photos in "{album.title}"
          </h2>
          <button onClick={() => props.setSelectedAlbum()} style={{ marginRight: '0.75em' }}>
            Back
          </button>
          <button onClick={() => props.setSlideshow(true)}>Slideshow</button>
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
        {items.map((i) => (
          <a href={`${i.baseUrl}=s1500`} target="_blank" key={i.id}>
            <LazyLoadImage src={placeholder ? 'https://via.placeholder.com/64' : `${i.baseUrl}=s64-c`} threshold={1000} />
          </a>
        ))}
      </div>

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
    </div>
  );
}
