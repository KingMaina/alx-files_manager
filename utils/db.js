// Mongo database client
import { MongoClient } from "mongodb";
import { promisify } from "util";

const DB_HOST = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const DB_PORT = process.env.DB_PORT ? process.env.DB_PORT : 27017;
const DB_DATABASE = process.env.DB_PORT ? process.env.DB_PORT : "files_manager";
const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this._client = new MongoClient(DB_URL, { useUnifiedTopology: true });
    this._connected = this._client.connect((error) => {
      if (error) return false;
      return true;
    });
  }

  isAlive() {
    return this._connected;
  }
}

const dbClient = new DBClient();
export default dbClient;
