import sha1 from 'sha1';
import dbClient from '../utils/db';
import { getAuthtoken, getXtoken } from '../utils/api';

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
    // TODO: Check if user exists
    const emailExists = await dbClient._users.findOne({ email });
    if (emailExists) return res.status(400).json({ error: 'Already exist' });
    const hashedPassword = sha1(password);
    const newUser = await dbClient._users.insertOne({
      email,
      password: hashedPassword,
    });
    return res.status(201).json({ id: newUser.insertedId, email });
  }

  /**
   * Retrieves the user
   * @param {import('express').Request} req API Request object
   * @param {import("express").Response} res API Response object
   */
  static async getMe(req, res) {
    // Auth the user
    const xToken = getXtoken(req);
    if (!xToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authToken = getAuthtoken(req);
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { email } = authToken;
    const user = await dbClient._db.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(201).json({ email, id: user.Id });
  }
}

export default UsersController;
