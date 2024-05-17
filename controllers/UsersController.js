import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import { STATUS_CODES, authenticateAndAuthorizeUser } from '../utils/api';

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
    const user = await authenticateAndAuthorizeUser(req);
    if (!user) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }
    return res
      .status(STATUS_CODES.CREATED)
      .json({ id: user.id, email: user.email });
  }
}

export default UsersController;
