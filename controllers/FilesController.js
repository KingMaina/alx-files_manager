import { v4 as UUID4 } from 'uuid';
import { ObjectId } from 'mongodb';
import {
  findFile, getXtoken, validateFile,
} from '../utils/api';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fs = require('fs').promises;

/**
 * Decodes a base64 string to UTF-8
 * @param {String} base64String A string encoded in Base64
 * @returns {String} The decoded text
 */
function decodeBase64(base64String) {
  if (typeof base64String !== 'string') {
    return null;
  }
  return Buffer.from(base64String, 'base64').toString('utf-8');
}

class FilesController {
  /**
   * Upload a file
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async postUpload(req, res) {
    const xToken = getXtoken(req);
    if (!xToken) return res.status(401).json({ error: 'Unauthorized1' });
    // Get user id from active session
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized2' });
    // Get user from database
    const user = await dbClient._users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized3' });
    const fileData = await validateFile(req.body);
    if (!fileData.isValid) {
      return res
        .status(fileData.error.code || 400)
        .json({ error: fileData.error.message || 'Something went wrong' });
    }
    const { parentId = null } = req.body;
    if (parentId && parentId !== '0' && fileData.data.type !== 'folder') {
      console.log('Parent ID:', parentId);
      const parentFile = await findFile(parentId);
      console.log('Parent file: ', parentFile);
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    // Upload folder if found
    if (fileData.data.type === 'folder') {
      const results = await dbClient._files.insertOne({
        userId,
        name: fileData.data.name,
        type: fileData.data.type,
        isPublic: req.body.isPublic || false,
      });
      return res.status(201).json({
        id: results.insertedId,
        userId,
        name: fileData.data.name,
        type: fileData.data.type,
        isPublic: req.body.isPublic || false,
      });
    }
    // Store file locally
    const DEFAULT_FILE_STORAGE_FOLDER = '/tmp/files_manager';
    const { FOLDER_PATH = DEFAULT_FILE_STORAGE_FOLDER } = process.env;
    const fileName = UUID4().toString();
    const filePath = `${FOLDER_PATH}/${fileName}`;
    const dataDecoded = decodeBase64(req.body.data);
    if (!dataDecoded) {
      return res.status(401).json({ error: 'Unauthorized4' });
    }
    try {
      await fs.mkdir(FOLDER_PATH, { recursive: true });
      await fs.writeFile(filePath, dataDecoded, {
        encoding: 'utf-8',
        // mode: 0o767,
      });
    } catch (error) {
      console.error(error && error.message);
      return res
        .status(500)
        .json({ error: (error && error.message) || 'Something went wrong' });
    }
    const query = {
      userId,
      name: req.body.name,
      type: req.body.type,
      isPublic: req.body.isPublic || false,
      parentId: req.body.parentId || 0,
      localPath: filePath,
    };
    await dbClient._files.insertOne(query);
    query.id = query._id;
    delete query.localPath;
    delete query._id;
    return res.status(201).json(query);
  }

  /**
   * Retrieves a file
   * @param {import("express").Request} req API Request
   * @param {string} req.params.id File ID
   * @param {import("express").Response} res API Response
   */
  static async getShow(req, res) {
    // Auth the user
    const xToken = getXtoken(req);
    if (!xToken) return res.status(401).json({ error: 'Unauthorized' });
    // Get user id from active session
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // Get user from database
    const user = await dbClient._users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    // Get file ID
    const { id = null } = req.params;
    if (!id) return res.status(404).json({ error: 'Not Found' });
    // Search for file
    const file = await dbClient._files.findOne({ _id: ObjectId(id) });
    if (!file) return res.status(404).json({ error: 'Not Found' });
    return res.status(200).json(file);
  }
}

export default FilesController;
