import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

const DEFAULT_JWT_EXPIRES_IN = "7d";
const DEFAULT_BCRYPT_ROUNDS = 10;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET must be set before starting the backend.");
  }

  return secret;
}

export function normalizeUsername(username) {
  return String(username ?? "").trim().toLowerCase();
}

export function validatePassword(password) {
  return typeof password === "string" && password.length >= 6;
}

export async function hashPassword(password) {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS ?? "", 10);
  return bcrypt.hash(password, Number.isInteger(rounds) ? rounds : DEFAULT_BCRYPT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN
    }
  );
}

export async function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (!payload?.sub) {
      return null;
    }

    return prisma.user.findUnique({
      where: {
        id: String(payload.sub)
      }
    });
  } catch {
    return null;
  }
}

export async function requireAuth(request, response, next) {
  const header = request.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ error: "Missing bearer token." });
  }

  const user = await getUserFromToken(token);

  if (!user) {
    return response.status(401).json({ error: "Invalid or expired token." });
  }

  request.user = user;
  return next();
}

export function authResponse(user) {
  return {
    userId: user.id,
    username: user.username,
    token: createToken(user)
  };
}
