import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sendErrorResponse } from "../../../utils/errorHandler";
import {
  isValidEmail,
  isValidPassword,
} from "../../../utils/validationHelpers";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10"); // Using environment variable for salt rounds

type CreateUser = {
  user_id: string;
  username: string;
  email: string;
  password: string;
  user_type: string;
  profile_pic?: string;
  date_joined: Date;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
};

// User types as an Enum
enum UserType {
  WazaWarrior = "Waza Warrior",
  WazaMaster = "Waza Master",
}

export default async function createUser(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqBody: Partial<CreateUser> = req.body;

  if (!reqBody) {
    return sendErrorResponse(res, 400, "Missing request body");
  }

  const date = new Date();
  const {
    user_id = uuidv4(),
    username,
    email,
    password,
    user_type,
    profile_pic,
    date_joined = date,
    last_login = date,
    created_at = date,
    updated_at = date,
  } = reqBody;

  if (!username || !email || !password || !user_type) {
    return sendErrorResponse(res, 400, "Missing required fields");
  }

  if (!isValidEmail(email)) {
    return sendErrorResponse(res, 400, "Invalid email format");
  }

  if (!(Object.values(UserType) as string[]).includes(user_type)) {
    return sendErrorResponse(
      res,
      400,
      "Invalid user_type. User type must be Waza Warrior or Waza Master"
    );
  }

  if (!isValidPassword(password)) {
    return sendErrorResponse(
      res,
      400,
      "Invalid password format. Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character"
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const existingUsername = await prisma.users.findUnique({
      where: { username },
    });
    const existingEmail = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUsername) {
      return sendErrorResponse(res, 409, "Username already exists");
    }
    if (existingEmail) {
      return sendErrorResponse(res, 409, "Email already exists");
    }

    const newUser = await prisma.users.create({
      data: {
        user_id,
        username,
        email,
        password: hashedPassword,
        user_type,
        profile_pic,
        date_joined,
        last_login,
        created_at,
        updated_at,
      },
    });

    const { password, ...safeUser } = newUser;
    return res.status(201).json(safeUser);
  } catch (error: any) {
    console.error("Error while creating user:", error);
    if (error.code === "P2002") {
      return sendErrorResponse(res, 409, "Duplicate user_id");
    }
    return sendErrorResponse(res, 500, "Internal server error", error);
  }
}
