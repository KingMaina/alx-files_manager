import redis, { print } from 'redis';
import { promisify } from 'util';

class RedisClient {
  /** Redis connection status */
  // isRedisConnected;
  // /** Redis client connection */
  // #client;
  // /** Get value from redis store */
  // #getValue;
  // /** Set value in redis store using a `key` for a specified `duration` */
  // #setValue;
  // /** Delete value in redis store using a `key`*/
  // #deleteValue;

  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
    this.isRedisConnected = true;
    this.getValue = promisify(this.client.get).bind(this.client);
    this.setValue = promisify(this.client.setex).bind(this.client);
    this.deleteValue = promisify(this.client.del).bind(this.client);
    this.client
      .on('ready', () => {
        this.isRedisConnected = true;
      })
      // .on("connect", () => {
      //   console.log("Client connected"); // remove for checker
      //   this.#isRedisConnected = true;
      // })
      // TODO: Add events that may be of use to updating connection state e.g disconnect
      //   .on("connect", () => (this.#isRedisConnected = true))
      .on('error', (error) => {
        this.isRedisConnected = false;
        console.log(error.message);
        print(error);
      });
  }

  isAlive() {
    return this.isRedisConnected;
  }

  /**
   * Gets the value stored in redis using `key`
   * @param {string} key A key whose value is stored in redis
   * @returns {Promise<(any | null)>} The value stored, otherwise `null`
   */
  async get(key) {
    if (typeof key !== 'string') return null;
    try {
      return await this.getValue(key);
    } catch (error) {
      console.log(error.message);
      return null;
    }
  }

  /**
   * Sets the `value` in redis using `key` for a set duration
   * @param {string} key A key whose value is stored in redis
   * @param {any} value value stored in redis
   * @param {number} durationToStore time in `seconds` to store the value in redis
   * @returns {Promise<void>} Nothing
   */
  async set(key, value, durationToStore) {
    try {
      await this.setValue(key, durationToStore, value);
    } catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Deletes the value stored in redis using `key`
   * @param {string} key A key whose value is stored in redis
   * @returns {Promise<void>} Nothing
   */
  async del(key) {
    if (typeof key !== 'string') return;
    try {
      await this.deleteValue(key);
    } catch (error) {
      console.log(error.message);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
