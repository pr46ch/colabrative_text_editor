# SyncPad frontend deployment

This directory is a Next.js application and can be deployed directly to Vercel.

## Vercel project settings

When importing the repository, set **Root Directory** to `frontend`. Vercel will
use the included `package-lock.json`, install dependencies with `npm ci`, and run
`npm run build` automatically.

Add these environment variables for the Preview and Production environments:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-api-host.example
NEXT_PUBLIC_WS_BASE_URL=wss://your-api-host.example
```

Use the values in `.env.example` as the format reference. These variables are
public client configuration: do not put secrets in them. They are embedded when
the Next.js app is built, so redeploy after changing either value.

## Backend connection checklist

The API and WebSocket server live in the repository's `backend` directory and
must be hosted separately on a service that supports persistent WebSocket
connections. Configure its `CORS_ORIGIN` to include the deployed Vercel URL,
for example:

```text
CORS_ORIGIN=https://your-project.vercel.app
```

If you use a custom frontend domain, include that origin as well. Production
WebSocket URLs must use `wss://` and API URLs must use `https://`.
