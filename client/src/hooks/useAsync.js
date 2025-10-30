// Server State Handler

import { useState, useCallback, useEffect, useRef } from "react";

// run code automatically
export const useAsync = (func, dependencies = []) => {
  // everytime the "dependencies" is changed, the "execute" function will be updated then the useEffect will trigger
  // initialLoading state is set to true as this useAsync is ran immediately
  const { execute, ...state } = useAsyncInternal(func, dependencies, true);

  useEffect(() => {
    execute();
  }, [execute]);

  return state;
};

// return a function instead of automatically running the code
export const useAsyncFn = (func, dependencies = []) => {
  return useAsyncInternal(func, dependencies, false);
};

// only used in this file to support the two custom hooks
export const useAsyncInternal = (
  func,
  dependencies,
  initialLoading = false
) => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState();
  const [value, setValue] = useState();

  // Store the latest function in a ref so we don't need to include it in dependencies
  const funcRef = useRef(func);

  // Update the ref whenever func changes
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  // use useCallBack as this function handles network requests and we dont want to re-render them when nothing related is changed
  // Note: dependencies is a parameter passed to this hook, so it's dynamic by design
  // This is a valid pattern for reusable hooks - ESLint can't verify dynamic dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const execute = useCallback((...params) => {
    setLoading(true);
    return funcRef
      .current(...params) // use the ref to get the latest func
      .then(data => {
        setValue(data);
        setError(undefined);
        return data;
      })
      .catch(error => {
        setError(error);
        setValue(undefined);
        return Promise.reject(error);
      })
      .finally(() => {
        // will execute no matter what
        setLoading(false);
      });
  }, dependencies);

  return { loading, error, value, execute };
};
