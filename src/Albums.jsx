import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import { ReactComponent as Logout } from './img/log-out.svg';

import { placeholder, SERVER } from './util';

const HeaderLeft = (props) =>
  props.headerRef.current ? ReactDOM.createPortal(props.children, props.headerRef.current.querySelector('.left')) : null;

const HeaderRight = (props) =>
  props.headerRef.current ? ReactDOM.createPortal(props.children, props.headerRef.current.querySelector('.right')) : null;

export function Albums(props) {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetch(`${SERVER}/albums`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setAlbums(data.albums);
      });

    return () => (isMounted = false);
  }, []);

  return (
    <div
      className="albums"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 12em)', placeContent: 'flex-start space-between', gap: '1.5em' }}
    >
      <HeaderLeft headerRef={props.headerRef}>
        <h2 style={{ margin: 0 }}>Albums</h2>
      </HeaderLeft>
      <HeaderRight headerRef={props.headerRef}>
        <>
          <span style={{ marginRight: '0.75em' }}>{props.client}</span>
          <button
            onClick={() => {
              location.href = `${SERVER}/oauth?logout=true&redirect=${location.href}`;
            }}
          >
            <Logout />
            Logout
          </button>
        </>
      </HeaderRight>
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
  );
}
