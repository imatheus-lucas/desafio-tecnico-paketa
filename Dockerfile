FROM node:24-alpine AS base

WORKDIR /app
COPY package*.json ./

FROM base AS dependencies

RUN npm ci

FROM dependencies AS development

ENV NODE_ENV=development
COPY tsconfig.json tsconfig.test.json prettier.config.js ./
COPY src ./src
COPY tests ./tests
CMD ["npm", "run", "dev"]

FROM dependencies AS build

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS production

ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/src/server.js"]
