// Server State Handler

import { useState, useCallback, useEffect } from "react";

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

  // use useCallBack as this function handles network requests and we dont want to re-render them when nothing related is changed
  const execute = useCallback((...params) => {
    setLoading(true);
    return func(...params) // the params are from the passed in func
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
