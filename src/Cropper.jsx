import React, { useEffect, useRef, useState } from 'react';
import { SERVER, colors, imageWidth, ipadHeight, ipadWidth } from './util';

let dragOffset = 0;

export function Cropper(props) {
  const cropPhoto = props.cropPhoto;
  const [cropTop, setCropTop] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dragRef = useRef();

  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setSaving(false);
    setSaved(false);

    if (cropPhoto && cropPhoto !== true) {
      setCropTop(0);

      fetch(`${SERVER}/crop/${cropPhoto.id}?url=${cropPhoto.baseUrl}`)
        .then((res) => res.json())
        .then((data) => {
          setCropTop(data.top || 0);
        })
        .catch((err) => console.error(err));
    }
  }, [cropPhoto]);

  useEffect(() => {
    if (dims.height < ipadHeight) setCropTop(0);
  }, [dims]);

  const top = `${(cropTop / dims.height) * 100}%`;
  const bottom = `${((dims.height - cropTop - ipadHeight) / dims.height) * 100}%`;
  const edge = `${((dims.width - ipadWidth) / 2 / dims.width) * 100}%`;

  if (cropPhoto)
    return (
      <div
        style={{
          width: '45vw',
          borderLeft: `1px solid #ccc`,
          marginLeft: '1.5em',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            position: 'sticky',
            top: 0,
            maxWidth: '100%',
            padding: '1.5em',
            paddingRight: 0,
          }}
        >
          {cropPhoto === true ? (
            <h2>Choose a photo to crop</h2>
          ) : (
            <div>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  overflow: 'hidden',
                  width: 'fit-content',
                  height: 'fit-content',
                  userSelect: 'none',
                }}
                ref={dragRef}
              >
                <img
                  src={`${SERVER}/image/${cropPhoto.id}?subdir=image&url=${encodeURIComponent(`${cropPhoto.baseUrl}=w${imageWidth}`)}`}
                  style={{ maxHeight: '80vh', maxWidth: '100%', borderRadius: 0 }}
                  onLoad={(e) => setDims({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: edge,
                    right: edge,
                    top,
                    bottom,
                    outline: '2px solid white',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                    zIndex: 1,
                    cursor: 'ns-resize',
                  }}
                  onMouseDown={(e) => {
                    const el = dragRef.current;
                    if (!el) return;

                    const localCursorY = e.clientY - el.getBoundingClientRect().top;
                    const cursorPercentage = localCursorY / el.getBoundingClientRect().height;

                    dragOffset = Math.max(0, cursorPercentage * dims.height - cropTop);
                  }}
                  onMouseMove={(e) => {
                    const el = dragRef.current;
                    if (e.buttons !== 1 || !el || e.target === el || saving) return;

                    const localCursorY = e.clientY - el.getBoundingClientRect().top;
                    const cursorPercentage = localCursorY / el.getBoundingClientRect().height;

                    const cropTop = cursorPercentage * dims.height - dragOffset;
                    setCropTop(Math.max(0, Math.min(Math.abs(dims.height - ipadHeight), cropTop)));
                  }}
                ></div>
              </div>

              <div style={{ display: 'flex', gap: '1em', alignItems: 'center', justifyContent: 'center', marginTop: '1em' }}>
                {/* <input
                  type="range"
                  disabled={dims.height < ipadHeight + 5}
                  min={0}
                  max={Math.abs(dims.height - ipadHeight)}
                  step={5}
                  value={cropTop}
                  onChange={(e) => setCropTop(Number.parseInt(e.target.value))}
                /> */}

                <button onClick={props.previousPhoto} disabled={saving}>
                  Previous
                </button>

                <button
                  onClick={() => {
                    setSaving(true);
                    fetch(`${SERVER}/crop/${cropPhoto.id}?top=${cropTop}`, { method: 'POST' })
                      .then((res) => res.json())
                      .then((data) => {
                        // console.log(data);
                        setSaved(true);
                      })
                      .catch((err) => console.error(err))
                      .finally(() => {
                        setSaving(false);
                        props.nextPhoto();
                      });
                  }}
                  disabled={saving}
                  style={{ background: colors.theme, color: colors.light }}
                >
                  Save + Next
                  <span style={{ color: colors.theme, position: 'absolute', bottom: '0.25em', marginLeft: '0.75em' }}>{saved && '✓'}</span>
                </button>

                <button onClick={props.close} disabled={saving} style={{ background: '#d66', color: colors.light }}>
                  Cancel
                </button>
              </div>

              <progress value={props.progress} style={{ width: '100%', marginTop: '2em' }} />
            </div>
          )}
        </div>
      </div>
    );
}
