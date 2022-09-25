const PORT = 8500;
export const SERVER = import.meta.env.PROD ? `http://home.amcolash.com:${PORT}` : `http://localhost:${PORT}`;
export const placeholder = false;
export const slideshowActive = 'photo-frame-slideshow';

export const colors = {
  theme: '#5e9626',
  background: '#f5f5f5',
  border: '#333',
};

export function setIntervalImmediately(func, interval) {
  func();
  return setInterval(func, interval);
}

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

export function logError(e) {
  if (console.error) console.error(e.message, e.stack);
  else console.log(e);
}
