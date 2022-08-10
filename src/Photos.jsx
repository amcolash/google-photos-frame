import React, { useCallback, useEffect, useState } from 'react';

import { SERVER } from './util';

export function Photos(props) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const album = props.selectedAlbum;

  useEffect(async () => {
    let loadMore = true;
    let page = undefined;

    let allItems = [];
    while (loadMore) {
      const res = await fetch(`${SERVER}/album/${album.id}${page ? `/${page}` : ''}`);
      const data = await res.json();

      page = data.nextPageToken;
      if (!page) loadMore = false;
      allItems = [...allItems, ...data.mediaItems];

      setItems(allItems);
    }

    setLoading(false);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={`${album.coverPhotoBaseUrl}=w128-h128-c`} style={{ margin: '1em', marginLeft: 0 }} />
        <div>
          <h3>
            {album.mediaItemsCount} photos in "{album.title}"
          </h3>
          <button onClick={() => props.setSelectedAlbum()}>Clear</button>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 4em)', placeContent: 'flex-start space-between', gap: '0.5em' }}
      >
        {items.map((i) => (
          <a href={`${i.baseUrl}=s1500`} target="_blank" key={i.id}>
            <img src={`${i.baseUrl}=w64-h64-c`} />
          </a>
        ))}
      </div>
    </div>
  );
}
