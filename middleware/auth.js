const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'rsph_admin';
const secret = () => process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

function signToken(username) {
  return jwt.sign({ u: username }, secret(), { expiresIn: '12h' });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not signed in.' });
  try {
    req.admin = jwt.verify(token, secret());
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expired — please sign in again.' });
  }
}

function readAdmin(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return null;
  try { return jwt.verify(token, secret()); } catch (e) { return null; }
}

module.exports = { COOKIE_NAME, signToken, setAuthCookie, clearAuthCookie, requireAdmin, readAdmin };
