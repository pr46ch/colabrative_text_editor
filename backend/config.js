export const PORT = Number(process.env.PORT) || 8000;
export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export function getCorsOrigin() {
  const origin = process.env.CORS_ORIGIN;

  if (!origin) {
    return process.env.NODE_ENV === "production" ? [] : true;
  }

  return origin.split(",").map((entry) => entry.trim());
}

export function isAllowedOrigin(origin) {
  const allowedOrigins = getCorsOrigin();

  return (
    allowedOrigins === true ||
    (typeof origin === "string" && allowedOrigins.includes(origin))
  );
}

export function validateProductionConfig() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const required = ["DATABASE_URL", "REDIS_URL", "JWT_SECRET", "CORS_ORIGIN"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}
