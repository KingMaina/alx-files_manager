import { v4 as UUID4 } from 'uuid';
import { ObjectId } from 'mongodb';
import {
  STATUS_CODES,
  authenticateAndAuthorizeUser,
  findFile,
  validateFile,
} from '../utils/api';
import dbClient from '../utils/db';

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
    const user = await authenticateAndAuthorizeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const fileData = await validateFile(req.body);
    if (!fileData.isValid) {
      return res
        .status(fileData.error.code || 400)
        .json({ error: fileData.error.message || 'Something went wrong' });
    }
    const { parentId = null } = req.body;
    if (parentId && parentId !== '0' && fileData.data.type !== 'folder') {
      const parentFile = await findFile(parentId);
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
        userId: user.id,
        name: fileData.data.name,
        type: fileData.data.type,
        isPublic: req.body.isPublic || false,
      });
      return res.status(201).json({
        id: results.insertedId,
        userId: user.id,
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
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      await fs.mkdir(FOLDER_PATH, { recursive: true });
      await fs.writeFile(filePath, dataDecoded, {
        encoding: 'utf-8',
        // mode: 0o767,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: (error && error.message) || 'Something went wrong' });
    }
    const query = {
      userId: user.id,
      name: req.body.name,
      type: req.body.type,
      isPublic: req.body.isPublic || false,
      parentId: req.body.parentId || 0,
      localPath: filePath,
      // data: req.body.data,
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
   * @param {import("express").Response} res API Response
   */
  static async getShow(req, res) {
    const user = await authenticateAndAuthorizeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    // Get file ID
    const { id = null } = req.params;
    if (!id) return res.status(404).json({ error: 'Not Found' });
    // Search for file
    const file = await dbClient._files.findOne({ _id: ObjectId(id) });
    if (!file) return res.status(404).json({ error: 'Not Found' });
    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Retrieves all files for a user based on folders if any
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async getIndex(req, res) {
    const user = await authenticateAndAuthorizeUser(req);
    if (!user) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ error: 'Unauthorized' });
    }
    const {
      parentId = 0,
      // page = 0,
    } = req.query;
    // TODO: Add pagination
    const files = await dbClient._files.find({ parentId }).toArray();
    const filesDataObjects = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));
    return res.status(STATUS_CODES.SUCCESS).json(filesDataObjects);
  }

  /**
   * Publishes a file
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async putPublish(req, res) {
    const user = await authenticateAndAuthorizeUser(req);
    if (!user) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const filter = {
      userId: user.id,
      _id: ObjectId(id),
    };
    const file = await dbClient._files.findOne(filter);
    if (!file) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ error: 'Not Found' });
    }
    await dbClient._files.updateOne(filter, {
      $set: {
        isPublic: true,
      },
    });
    return res.status(STATUS_CODES.SUCCESS).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  /**
   * Unpublishes a file
   * @param {import("express").Request} req API Request
   * @param {import("express").Response} res API Response
   */
  static async putUnpublish(req, res) {
    const user = await authenticateAndAuthorizeUser(req);
    if (!user) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const filter = {
      userId: user.id,
      _id: ObjectId(id),
    };
    const file = await dbClient._files.findOne(filter);
    if (!file) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ error: 'Not Found' });
    }
    await dbClient._files.updateOne(
      { userId: user.id, _id: ObjectId(id) },
      { $set: { isPublic: false } },
    );
    return res.status(STATUS_CODES.SUCCESS).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }
}

export default FilesController;
