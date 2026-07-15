// When your React app communicates with your Node.js backend, protected routes will require the JWT token
//  to verify your identity. Instead of manually writing logic to fetch the token from localStorage and adding
//  it to headers inside every single request you write for the rest of this project, you can set up an Axios Instance with an Interceptor.

// Axios Instance: A custom, configured copy of the Axios library. It lets you predefine baseline settings
// (like your backend's baseURL) so you don't have to retype https://dtube-api-2.onrender.com in every component.

// Axios Interceptor: A function that acts like an automated postal clerk.
// Right before any request leaves your frontend, the interceptor intercepts it, opens the digital envelope,
//  slips in the Authorization header containing the user's token, seals it, and sends it on its way.

import axios from "axios";

// Create an Axios instance with our fixed backend URL
const api = axios.create({
  baseURL: "https://dtube-api-2.onrender.com",
});

// Set up a Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Look into the browser's localStorage to see if a token exists
    const token = localStorage.getItem("token");

    // If a token is found, automatically inject it into the Authorization header
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Return the modified configuration so the request can proceed
    return config;
  },
  (error) => {
    // If something fails before the request is even sent
    return Promise.reject(error);
  },
);

export default api;

// From this point forward, whenever you want to make an authenticated server call
// in a React component, instead of using standard axios.post(), you will import this file and use api.post().
//  It will seamlessly handle your authentication tokens behind the scenes.

// Axios interceptor is ready, our React app can send tokens automatically...
