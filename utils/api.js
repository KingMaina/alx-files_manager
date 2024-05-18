import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

const ACCEPTED_FILE_TYPES = ['folder', 'file', 'image'];
export const IMG_THUMBNAIL_WIDTHS = [500, 250, 100];
export const DEFAULT_FILE_STORAGE_FOLDER = '/tmp/files_manager';
export const ROOT_ID = ObjectId(Buffer.alloc(24, '0').toString('utf-8'));
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
};

/**
 * Retrieves the user's API token
 * @param {import("express").Request} req API Request object
 * @returns {String | null} The user's X token or null if not found
 */
export function getXtoken(req) {
  if (!req) return null;
  const xToken = req.header('X-Token') || '';
  if (!xToken) return null;
  return xToken;
}

/**
 * Retrieves the user's Authorization token
 * @param {import("express").Request} req API Request object
 * @returns {{email: string, password: string} | null} The user's email and password, null otherwise
 */
export function getAuthtoken(req) {
  if (!req) return null;
  // Get token
  const authToken = req.header('Authorization') || '';
  if (!authToken) return null;
  const userToken = authToken.split(' ');
  if (userToken.length !== 2) return null;
  const [, token] = userToken;
  // Decode token
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [email, password] = decoded.split(':');
  if (!email || !password) return null;
  return { email, password };
}

export function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    return null;
  }
  return sha1(password);
}

export function verifyPasswordHash(password, hashedPassword) {
  const passwordHash = hashPassword(password);
  if (passwordHash && passwordHash === hashedPassword) {
    return true;
  }
  return false;
}

export async function findFile(parentId) {
  const file = await dbClient._files.findOne({ _id: ObjectId(parentId) });
  return file;
}

/**
 * Validates the input data file
 * @param {import("express").Request} req API Request object
 */
export async function validateFile(fileData) {
  const results = {
    isValid: false,
    data: {},
    error: {
      code: null,
      message: '',
    },
  };
  const {
    name, type, data = null, isPublic = false,
  } = fileData;
  if (!name || typeof name !== 'string') {
    results.error.message = 'Missing name';
    return results;
  }
  if (!type || typeof type !== 'string' || !ACCEPTED_FILE_TYPES.includes(type)) {
    results.error.message = 'Missing type';
    return results;
  }
  if (!data && type !== 'folder') {
    results.error.message = 'Missing data';
    return results;
  }
  results.isValid = true;
  results.data = {
    ...results.data,
    name,
    type,
    data,
    isPublic,
  };
  return results;
}

/**
 * Authenticate and authorize the user
 * @param {import("express").Request} req API Request
 */
export async function authenticateAndAuthorizeUser(req) {
  try {
    // Auth the user
    const xToken = getXtoken(req);
    if (!xToken) return null;
    // Get user id from active session
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return null;
    // Get user from database
    const user = await dbClient._users.findOne({ _id: ObjectId(userId) });
    if (!user) return null;
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      xToken,
    };
  } catch (error) {
    return null;
  }
}
