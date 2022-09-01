import { useEffect, useState } from 'react';
import equal from 'fast-deep-equal/es6';

import { SERVER, setIntervalImmediately } from '../util';
import { usePrevious } from './usePrevious';

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