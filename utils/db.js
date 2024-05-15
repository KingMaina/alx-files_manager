// Mongo database client
import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const DB_PORT = process.env.DB_PORT ? process.env.DB_PORT : 27017;
const DB_DATABASE = process.env.DB_DATABASE
  ? process.env.DB_DATABASE
  : 'files_manager';
const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}`; // Remove connection of atlas

class DBClient {
  constructor() {
    MongoClient.connect(
      DB_URL,
      { useUnifiedTopology: true },
      (error, client) => {
        if (error) {
          console.log('Database connection error', error);
          // client.close();
        } else {
          this._db = client.db(DB_DATABASE);
          this._users = this._db.collection('users');
          this._files = this._db.collection('files');
        }
      },
    );
  }

  isAlive() {
    return !!this._db;
  }

  /**
   * Counts the total number of users
   * @returns Number of users in the database
   */
  async nbUsers() {
    // if (!this.isAlive()) return 0;
    const users = await this._users.countDocuments();
    return users;
  }

  /**
   * Counts the total number of files
   * @returns Number of files in the database
   */
  async nbFiles() {
    // if (!this.isAlive()) return 0;
    const files = await this._files.countDocuments();
    return files;
  }
}

const dbClient = new DBClient();
export default dbClient;
