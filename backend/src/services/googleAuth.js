const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  if (!idToken) {
    throw new Error('Google ID token is required');
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email_verified) {
    throw new Error('Google email is not verified');
  }

  return payload;
}

module.exports = {
  verifyGoogleToken,
};
