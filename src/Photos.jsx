import React, { useEffect, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Slideshow } from './Slideshow';

import { placeholder, SERVER, themeColor } from './util';

export function Photos(props) {
  const album = props.selectedAlbum;

  const [items, setItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [slideshow, setSlideshow] = useState(false);

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

      {!slideshow && (
        <PhotoList album={album} items={items} progress={progress} setSelectedAlbum={props.setSelectedAlbum} setSlideshow={setSlideshow} />
      )}
      {slideshow && <Slideshow items={items} setSlideshow={setSlideshow} />}
    </div>
  );
}

function PhotoList(props) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={placeholder ? `${SERVER}/image?size=128&id=${props.album.id}` : `${props.album.coverPhotoBaseUrl}=s128-c`}
          style={{ margin: '1em', marginLeft: 0 }}
        />
        <div>
          <h2 style={{ marginTop: 0 }}>
            {props.album.mediaItemsCount} photos in "{props.album.title}"
          </h2>
          <button onClick={() => props.setSelectedAlbum()} style={{ marginRight: '0.75em' }}>
            Back
          </button>
          <button onClick={() => props.setSlideshow(true)} disabled={props.progress < 1}>
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
          <a href={placeholder ? `${SERVER}/image?size=1500&id=${i.id}` : `${i.baseUrl}=s1500`} target="_blank" key={i.id}>
            <LazyLoadImage src={placeholder ? `${SERVER}/image?size=64&id=${i.id}` : `${i.baseUrl}=s64-c`} threshold={1000} />
          </a>
        ))}
      </div>
    </div>
  );
}
