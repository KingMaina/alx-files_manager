import { request, response } from "express";
import sha1 from "sha1";
import dbClient from "../utils/db";

class UsersController {
  /**
   * Adds a new user
   * @param {request} req API Request object
   * @param {response} res API Response object
   */
  static async postNew(req, res) {
    const { email = "", password = "" } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    if (!password) return res.status(400).json({ error: "Missing password" });
    // TODO: Check if user exists
    const emailExists = await dbClient._users
      .findOne({ email });
    if (emailExists) return res.status(400).json({ error: "Already exist" });
    const hashedPassword = sha1(password);
    const newUser = dbClient._users.insertOne(
      { email, password: hashedPassword },
      { new: true },
    );
    return res.status(201).json({ id: newUser._id, email });
  }

  /**
   * Retrieves the user
   * @param {request} req API Request object
   * @param {response} res API Response object
   */
  static getMe(req, res) {
    // Auth the user
    // TODO: Return user id from db
    // res.status(201).json({ email, id: userId });
  }
}

export default UsersController;
