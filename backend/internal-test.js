const app = require('./app');

const req = {
  url: '/api/accounts',
  method: 'POST',
  originalUrl: '/api/accounts',
  headers: {
    'content-type': 'application/json'
  },
  body: {
    email: 'mock@test.com',
    password: 'Password123'
  },
  on: () => {},
  socket: { remoteAddress: '127.0.0.1' },   // Mocking enough for express.json()
  read: () => null
};

// We need a proper mock request for express.json(), better yet, skip express.json() by parsing ourselves
// Let's use supertest if it's available. If not, we just use a basic mock ServerResponse.

const res = {
  status: function(code) { this.statusCode = code; return this; },
  json: function(data) { console.log('RESPONSE STATUS:', this.statusCode, 'DATA:', JSON.stringify(data)); process.exit(0); },
  send: function(data) { console.log('RESPONSE STATUS:', this.statusCode, 'DATA:', data); process.exit(0); },
  setHeader: () => {},
  end: function() { console.log('RESPONSE ENDED'); process.exit(0); }
};

console.log("Mocking request to POST /api/accounts...");
try {
  // express.json() needs a stream, let's just cheat and override body
  app.handle(req, res);
} catch (e) {
  console.error("ERROR", e);
}
