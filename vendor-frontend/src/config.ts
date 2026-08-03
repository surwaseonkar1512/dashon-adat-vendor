const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE = isLocalhost 
  ? 'http://localhost:5000/api/v1/vendor'
  : 'https://dashon-adat-vendor.onrender.com/api/v1/vendor';
