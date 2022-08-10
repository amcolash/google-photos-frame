import React, { useEffect, useState } from 'react';
import { SERVER } from './util';

export function Albums(props) {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch(`${SERVER}/albums`)
      .then((res) => res.json())
      .then((data) => setAlbums(data.albums));
  }, []);

  return (
    <div>
      <h3>Albums</h3>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 12em)', placeContent: 'flex-start space-between', gap: '1em' }}
      >
        {albums
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((a) => (
            <div key={a.id} onClick={() => props.setSelectedAlbum(a)} style={{ display: 'flex', alignItems: 'center' }}>
              <img src={`${a.coverPhotoBaseUrl}=w96-h96-c`} style={{ margin: '0.5em' }} />
              <div>{a.title}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
