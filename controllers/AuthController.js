import { v4 as uuid4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { getAuthtoken, getXtoken, hashPassword } from '../utils/api';

class AuthController {
  /**
   * Sign-in a user
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async getConnect(req, res) {
    const authToken = getAuthtoken(req);
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { email, password } = authToken;
    const user = await dbClient._users.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (hashPassword(password) !== user.password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuid4().toString();
    const redisKey = `auth_${token}`;
    await redisClient.set(redisKey, String(user._id), 24 * 60 * 60);
    return res.status(200).json({ token });
  }

  /**
   * Sign out a user
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async getDisconnect(req, res) {
    // Check X-token for authorization
    const xToken = getXtoken(req);
    if (!xToken) return res.status(401).json({ error: 'Unauthorized' });
    // Delete auth key from redis
    const redisKey = `auth_${xToken}`;
    await redisClient.del(redisKey);
    return res.status(204).json();
  }
}

export default AuthController;
