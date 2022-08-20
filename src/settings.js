import { useEffect, useRef, useState } from 'react';
import equal from 'fast-deep-equal/es6/react';
import { SERVER, setIntervalImmediately } from './util';

export function useSetting(optionName, client, defaultValue) {
  const [option, setOption] = useState(defaultValue);
  const [firstLoad, setFirstLoad] = useState(true);

  const prevOption = usePrevious(option);

  useEffect(() => {
    const timer = setIntervalImmediately(
      () =>
        fetch(`${SERVER}/settings/${client}/${optionName}`)
          .then((res) => res.json())
          .then((data) => setOption(data[optionName])),
      10 * 1000
    );

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (optionName !== 'login' && !equal(option, prevOption) && !firstLoad) {
      fetch(`${SERVER}/settings/${client}/${optionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [optionName]: option }),
      });
    }

    setFirstLoad(false);
  }, [option]);

  return [option, setOption];
}

// From https://usehooks.com/usePrevious/
function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();
  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref.current;
}
