FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install all packages long enough to generate Prisma, then remove dev tools.
RUN npm ci --ignore-scripts && npx prisma generate && npm prune --omit=dev

COPY . .

RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8000) + '/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
