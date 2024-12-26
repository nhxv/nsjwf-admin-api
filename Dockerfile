FROM node:23-slim AS base
# Required for Prisma
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /usr/local/app/
RUN mkdir uploads backend
RUN chown node:node uploads/ backend/

### Dev
FROM node:23 AS deps
WORKDIR /usr/local/app/backend
COPY package.json package-lock.json ./
# Have to copy this BEFORE running generate
# Relevant discussion: https://github.com/prisma/prisma/issues/2584#issuecomment-1411794452
COPY prisma ./prisma/
RUN npm i && npm run prisma:generate

FROM base AS dev
WORKDIR /usr/local/app/backend
COPY --from=deps /usr/local/app/backend/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY .env ./
COPY wait-for-it.sh docker-entry.sh /usr/local/app/backend/
EXPOSE 8000
ENTRYPOINT [ "bash", "docker-entry.sh" ]
# No need to prisma:generate cuz it's done earlier.
CMD npm run prisma:apply && npm run dev


### Prod
FROM node:23 AS deps-prod
WORKDIR /usr/local/app/backend
COPY package.json package-lock.json ./
# Only necessary dependencies
RUN npm pkg delete scripts.prepare && npm i --omit=dev

# Build to JS
FROM node:23 AS build-prod
WORKDIR /usr/local/app/backend
# Need tsc to compile to js
COPY --from=deps /usr/local/app/backend/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src/
COPY prisma ./prisma/
COPY tsconfig.json ./
RUN npm run build

FROM base AS prod
WORKDIR /usr/local/app/backend
COPY --from=deps-prod /usr/local/app/backend/node_modules ./node_modules
COPY --from=build-prod /usr/local/app/backend/dist ./dist
# No need to copy source files.
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY .env ./
COPY wait-for-it.sh docker-entry.sh /usr/local/app/backend/
EXPOSE 8000
ENTRYPOINT [ "bash", "docker-entry.sh" ]
CMD npm run prisma:apply && npm run prisma:generate && npm run start
