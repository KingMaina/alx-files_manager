import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Get the status of the API clients
   * @param {request} req API Request object
   * @param {response} res API Response object
   */
  static async getStatus(req, res) {
    const dbStatus = dbClient.isAlive();
    const redisStatus = redisClient.isAlive();
    res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  /**
   * Get the statistics of users and files
   * @param {import('express').Request} req API request object
   * @param {import('express').Response} res API response object
   */
  static async getStats(req, res) {
    const numUsers = await dbClient.nbUsers();
    const numFiles = await dbClient.nbFiles();
    res.status(200).json({ users: numUsers, files: numFiles });
  }
}

export default AppController;
