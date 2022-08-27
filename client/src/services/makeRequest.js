import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL,
  withCredentials: true, // for using Cookies to store user information, this gives the Cookies to the server
});

export const makeRequest = (url, options) => {
  return api(url, options)
    .then(res => res.data)
    .catch(err => Promise.reject(err?.response?.data?.message ?? "Error"));
};
