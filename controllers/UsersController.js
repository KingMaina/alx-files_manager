import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import { getXtoken } from '../utils/api';
import redisClient from '../utils/redis';

class UsersController {
  /**
   * Adds a new user
   * @param {import('express').Request} req API Request object
   * @param {import('express').Response} res API Response object
   */
  static async postNew(req, res) {
    const { email = '', password = '' } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });
    const emailExists = await dbClient._users.findOne({ email });
    if (emailExists) return res.status(400).json({ error: 'Already exist' });
    const hashedPassword = sha1(password);
    const newUser = await dbClient._users.insertOne({
      email,
      password: hashedPassword,
    });
    const userQueue = new Queue('userQueue');
    userQueue.add('userQueue', { userId: newUser.insertedId });
    return res.status(201).json({ id: newUser.insertedId, email });
  }

  /**
   * Retrieves the user
   * @param {import('express').Request} req API Request object
   * @param {import('express').Response} res API Response object
   */
  static async getMe(req, res) {
    // Auth the user
    const xToken = getXtoken(req);
    if (!xToken) return res.status(401).json({ error: 'Unauthorized' });
    // Get user id from active session
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // Get user from database
    const user = await dbClient._users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.status(201).json({ email: user.email, id: userId });
  }
}

export default UsersController;
