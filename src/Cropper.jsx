import React, { useEffect, useState } from 'react';
import { SERVER, colors } from './util';

const dims = 1200;
const height = 1200 / 1.33;

export function Cropper(props) {
  const cropPhoto = props.cropPhoto;
  const [cropTop, setCropTop] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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

  const top = `${(cropTop / dims) * 100}%`;
  const bottom = `${(1 - (cropTop + height) / dims) * 100}%`;

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
              <div style={{ position: 'relative', display: 'flex', overflow: 'hidden' }}>
                <img
                  src={`${SERVER}/image/${cropPhoto.id}?subdir=image&url=${encodeURIComponent(`${cropPhoto.baseUrl}=s1200-c`)}`}
                  style={{ maxHeight: '80vh', maxWidth: '100%', borderRadius: 0 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top,
                    bottom,
                    outline: '2px solid white',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                    zIndex: 1,
                  }}
                ></div>
              </div>

              <div style={{ display: 'flex', gap: '1em', alignItems: 'center', justifyContent: 'center', marginTop: '1em' }}>
                <input
                  type="range"
                  min={0}
                  max={dims - height}
                  value={cropTop}
                  onChange={(e) => setCropTop(Number.parseInt(e.target.value))}
                />
                <button
                  onClick={() => {
                    setSaving(true);
                    fetch(`${SERVER}/crop/${cropPhoto.id}?top=${cropTop}`, { method: 'POST' })
                      .then((res) => res.json())
                      .then((data) => console.log(data))
                      .catch((err) => console.error(err))
                      .finally(() => setSaving(false));
                  }}
                  disabled={saving}
                  style={{ background: colors.theme, color: colors.light }}
                >
                  Save
                </button>

                <button onClick={props.nextPhoto} disabled={saving}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
}
