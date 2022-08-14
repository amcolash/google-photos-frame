import React, { useEffect, useState } from 'react';
import { placeholder, SERVER } from './util';

export function Albums(props) {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch(`${SERVER}/albums`)
      .then((res) => res.json())
      .then((data) => setAlbums(data.albums));
  }, []);

  return (
    <div>
      <h2>Albums</h2>
      <div
        className="albums"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 12em)', placeContent: 'flex-start space-between', gap: '1.5em' }}
      >
        {albums
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((a) => (
            <div className="album" key={a.id} onClick={() => props.setSelectedAlbum(a)} style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={placeholder ? `${SERVER}/image?size=96&id=${a.id}` : `${a.coverPhotoBaseUrl}=s96-c`}
                style={{ marginRight: '0.5em' }}
              />
              <div>{a.title}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
