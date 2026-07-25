import { Router } from "express";
import {
  authResponse,
  hashPassword,
  normalizeUsername,
  requireAuth,
  validatePassword,
  verifyPassword
} from "../auth.js";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export function createAuthRouter() {
  const router = Router();

  router.get("/me", requireAuth, (request, response) => {
    return response.json({
      userId: request.user.id,
      username: request.user.username
    });
  });

  router.post(
    "/register",
    asyncHandler(async (request, response) => {
      const username = normalizeUsername(request.body?.username);
      const password = String(request.body?.password ?? "");

      if (!username || !validatePassword(password)) {
        return response.status(400).json({
          error: "Username is required and password must be at least 6 characters."
        });
      }

      const passwordHash = await hashPassword(password);

      try {
        const user = await prisma.user.create({
          data: {
            username,
            passwordHash
          }
        });

        console.log(`[auth] registered ${username}`);
        return response.status(201).json(authResponse(user));
      } catch (error) {
        if (error.code === "P2002") {
          const existingUser = await prisma.user.findUnique({
            where: {
              username
            }
          });

          if (existingUser && (await verifyPassword(password, existingUser.passwordHash))) {
            console.log(`[auth] ${username} registered previously; signed in`);
            return response.json(authResponse(existingUser));
          }

          return response.status(409).json({
            error: "Username is already taken. Sign in instead, or use a different username."
          });
        }

        throw error;
      }
    })
  );

  router.post(
    "/signin",
    asyncHandler(async (request, response) => {
      const username = normalizeUsername(request.body?.username);
      const password = String(request.body?.password ?? "");

      if (!username || !password) {
        return response.status(400).json({ error: "Username and password are required." });
      }

      const user = await prisma.user.findUnique({
        where: {
          username
        }
      });

      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return response.status(401).json({ error: "Invalid username or password." });
      }

      console.log(`[auth] ${username} signed in`);
      return response.json(authResponse(user));
    })
  );

  return router;
}
