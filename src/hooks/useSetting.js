import { useEffect, useState } from 'react';
import equal from 'fast-deep-equal/es6';

import { logError, SERVER, setIntervalImmediately } from '../util';
import { usePrevious } from './usePrevious';
import { useDebounce } from './useDebounce';

const settingOffsets = {};
let offset = 0;

export function useSetting(optionName, client, defaultValue) {
  const [option, setOption] = useState(defaultValue);
  const [firstLoad, setFirstLoad] = useState(true);

  const debouncedOption = useDebounce(option, 1000);
  const prevOption = usePrevious(option);

  if (!settingOffsets[optionName]) {
    offset += 150;
    settingOffsets[optionName] = offset;
  }

  useEffect(() => {
    const timer = setIntervalImmediately(
      () =>
        fetch(`${SERVER}/settings/${client}/${optionName}`)
          .then((res) => res.json())
          .then((data) => setOption(data[optionName]))
          .catch(logError),
      10 * 1000 + settingOffsets[optionName]
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
      }).catch(logError);
    }

    setFirstLoad(false);
  }, [option, prevOption, debouncedOption]);

  return [option, setOption, prevOption];
}
