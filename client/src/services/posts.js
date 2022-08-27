import { makeRequest } from "./makeRequest";

export const getPosts = () => {
  // backend end point route in server.js
  return makeRequest("/posts");
};

export const getPost = id => {
  // backend end point route in server.js
  return makeRequest(`/posts/${id}`);
};
