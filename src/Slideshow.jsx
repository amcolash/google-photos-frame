import React from 'react';

export function Slideshow(props) {
  return (
    <div>
      <h2>Slideshow</h2>
      <button onClick={() => props.setSlideshow(false)}>Back</button>
    </div>
  );
}
