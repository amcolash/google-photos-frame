const PORT = 3500;
export const SERVER = import.meta.env.PROD ? 'https://home.amcolash.com:9090/frame' : `http://192.168.1.146:${PORT}`;

const prefix = 'photo-frame';
export const selectedAlbumName = `${prefix}-album`;
export const durationName = `${prefix}-duration`;

export const themeColor = '#5e9626';

export const placeholder = false;

// From https://stackoverflow.com/a/2450976/2303432
export function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}
