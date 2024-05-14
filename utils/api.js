import sha1 from 'sha1';

/**
 * Retrieves the user's API token
 * @param {import("express").Request} req API Request object
 * @returns {String | null} The user's X token or null if not found
 */
export function getXtoken(req) {
  if (!req) return null;
  const xToken = req.header('X-Token') || '';
  if (!xToken) return null;
  return xToken;
}

/**
 * Retrieves the user's Authorization token
 * @param {import("express").Request} req API Request object
 * @returns {{email: string, password: string} | null} The user's email and password, null otherwise
 */
export function getAuthtoken(req) {
  if (!req) return null;
  // Get token
  const authToken = req.header('Authorization') || '';
  if (!authToken) return null;
  const userToken = authToken.split(' ');
  if (userToken.length !== 2) return null;
  const [, token] = userToken;
  // Decode token
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [email, password] = decoded.split(':');
  if (!email || !password) return null;
  return { email, password };
}

export function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    return null;
  }
  return sha1(password);
}

export function verifyPasswordHash(password, hashedPassword) {
  const passwordHash = hashPassword(password);
  if (passwordHash && passwordHash === hashedPassword) {
    return true;
  }
  return false;
}
