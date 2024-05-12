// Mongo database client
import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const DB_PORT = process.env.DB_PORT ? process.env.DB_PORT : 27017;
const DB_DATABASE = process.env.DB_PORT ? process.env.DB_PORT : 'files_manager';
const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    MongoClient.connect(DB_URL, { useUnifiedTopology: true }, (error, client) => {
      if (error) {
        console.log('Database connection error', error);
      } else {
        this._db = client.db(DB_DATABASE);
      }
    });
  }

  isAlive() {
    return !!this._db;
  }

  /**
   * Counts the total number of users
   * @returns Number of users in the database
   */
  async nbUsers() {
    if (!this.isAlive()) return 0;
    return this._db.collection('users').countDocuments();
  }

  /**
   * Counts the total number of files
   * @returns Number of files in the database
   */
  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this._db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
