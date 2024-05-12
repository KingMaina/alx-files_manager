import { request, response } from "express";
import dbClient from "../utils/db";

class UsersController {
  /**
   * Adds a new user
   * @param {request} req API Request object
   * @param {response} res API Response object
   */
  static postNew(req, res) {
    const { email, password } = req.body;
    if (!email) res.status(400).json({ error: "Missing email" });
    if (!password) res.status(400).json({ error: "Missing password" });
    // TODO: Check if user exists
    // const emailExists = dbClient;
    // if (emailExists) res.status(400).json({ error: "Already exist" });
    // hash password and save in db
    // Return user id from db
    // res.status(201).json({ email, id: userId });
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
