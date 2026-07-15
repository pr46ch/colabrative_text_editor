export const PORT = Number(process.env.PORT) || 8000;

export function getCorsOrigin() {
  const origin = process.env.CORS_ORIGIN;

  if (!origin) {
    return true;
  }

  return origin.split(",").map((entry) => entry.trim());
}
