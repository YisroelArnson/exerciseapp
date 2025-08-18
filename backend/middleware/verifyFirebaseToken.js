const { getAuth } = require('../firebase/config');

const auth = getAuth();

async function verifyFirebaseToken(req, res, next) {
  console.log('verifyFirebaseToken hit');
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const idToken = authHeader.split(' ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Missing ID token' });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = verifyFirebaseToken;


