import sha1 from 'sha1';
import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  /**
   * Sign-in a user
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async getConnect(req, res) {
    // TODO: Add basic auth
    const { email = '', password = '' } = req.body;
    const user = await dbClient._db.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (sha1(password) !== user.password) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    const token = crypto.randomUUID();
    const redisKey = `auth_${token}`;
    await redisClient.set(redisKey, user._id, 24 * 60 * 60);
    res.setHeader('X-Token', token);
    return res.status(200).json({ token });
  }

  /**
   * Sign out a user
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async getDisconnect(req, res) {
    // Check X-token for authorization
    const xToken = req.header('X-Token') || '';
    if (!xToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Get token
    const authToken = req.header('Authorization') || '';
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userToken = authToken.split();
    if (userToken.length !== 2) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [, token] = userToken;
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Find authenticated user
    const isUserFound = dbClient._db.findOne({ email });
    if (!isUserFound) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Delete auth key from redis
    const redisKey = `auth_${xToken}`;
    await redisClient.del(redisKey);
    return res.status(204).json();
  }
}

export default AuthController;
