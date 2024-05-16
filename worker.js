import Queue from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';
import { DEFAULT_FILE_STORAGE_FOLDER, IMG_THUMBNAIL_WIDTHS } from './utils/api';

const imageThumbnail = require('image-thumbnail');
const fsPromises = require('fs').promises;

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const fileId = job.data;
  const userId = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  } else if (!userId) {
    throw new Error('Missing userId');
  }
  const file = await dbClient._files.findOne({ _id: ObjectId(fileId), userId });
  if (!file) {
    throw new Error('File not found');
  }
  const thumbnailPromises = [];
  const { FOLDER_PATH = DEFAULT_FILE_STORAGE_FOLDER } = process.env;
  fsPromises.mkdir(FOLDER_PATH, { recursive: true });
  for (const thumbnailWidth of IMG_THUMBNAIL_WIDTHS) {
    try {
      const thumbnailImage = imageThumbnail(file.localPath, {
        width: thumbnailWidth,
      });
      const promise = fsPromises.writeFile(`${file.filePath}_${thumbnailWidth}`, thumbnailImage, {
        encoding: 'binary',
      });
      thumbnailPromises.push(promise);
    } catch (error) {
      throw new Error(error && error.message);
    }
  }
  await Promise.all(thumbnailPromises).catch(console.error);
});

userQueue.process(async (job) => {
  const userId = job.data;
  if (!userId) {
    throw new Error('Missing userId');
  }
  const user = await dbClient._users.findOne({ _id: ObjectId(userId) });
  if (!user) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${user.email}`);
});
