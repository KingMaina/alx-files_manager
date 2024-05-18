// Mongo database client
import { MongoClient } from 'mongodb';

const { DB_HOST = 'localhost' } = process.env;
const { DB_PORT = 27017 } = process.env;
const { DB_DATABASE = 'files_manager' } = process.env;
const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}`;
// const { MONGO_URL } = process.env; // Remove connection of atlas
// const DB_URL = `${MONGO_URL}`;

class DBClient {
  constructor() {
    MongoClient.connect(
      DB_URL,
      { useUnifiedTopology: true, useNewUrlParser: true },
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
