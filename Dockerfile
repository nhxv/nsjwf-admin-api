FROM node:22-slim AS base
# Required for Prisma
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /usr/local/app/
RUN mkdir uploads backend
RUN chown node:node uploads/ backend/

### Dev
FROM node:22 AS deps
WORKDIR /usr/local/app
RUN mkdir uploads backend && chown node:node uploads/ backend/
USER node
WORKDIR /usr/local/app/backend
COPY --chown=node package.json package-lock.json ./
# Have to copy this BEFORE running generate
# Relevant discussion: https://github.com/prisma/prisma/issues/2584#issuecomment-1411794452
COPY --chown=node prisma ./prisma/
RUN npm i && npm run prisma:generate

FROM base AS dev
USER node
WORKDIR /usr/local/app/backend
COPY --from=deps /usr/local/app/backend/node_modules ./node_modules
COPY --chown=node package.json package-lock.json ./
COPY --chown=node prisma ./prisma/
COPY --chown=node src ./src/
COPY --chown=node .env ./
COPY --chown=node container/node_backend/scripts/ ./scripts/
EXPOSE 8000
ENTRYPOINT [ "bash", "scripts/docker-entry.sh" ]
# No need to prisma:generate cuz it's done earlier.
CMD npm run prisma:apply && npm run dev


### Prod
FROM node:22 AS deps-prod
WORKDIR /usr/local/app
RUN mkdir uploads backend && chown node:node uploads/ backend/
USER node
WORKDIR /usr/local/app/backend
COPY --chown=node package.json package-lock.json ./
# Only necessary dependencies
RUN npm pkg delete scripts.prepare && npm i --omit=dev

# Build to JS
FROM node:22 AS build-prod
WORKDIR /usr/local/app
RUN mkdir uploads backend && chown node:node uploads/ backend/
USER node
WORKDIR /usr/local/app/backend
# Need tsc to compile to js
COPY --from=deps /usr/local/app/backend/node_modules ./node_modules
COPY --chown=node package.json package-lock.json ./
COPY --chown=node src ./src/
COPY --chown=node prisma ./prisma/
COPY --chown=node tsconfig.json ./
RUN npm run build

FROM base AS prod
USER node
WORKDIR /usr/local/app/backend
COPY --from=deps-prod /usr/local/app/backend/node_modules ./node_modules
COPY --from=build-prod /usr/local/app/backend/dist ./dist
# No need to copy source files.
COPY --chown=node package.json package-lock.json ./
COPY --chown=node prisma ./prisma/
COPY --chown=node .env ./
COPY --chown=node container/node_backend/scripts/ ./scripts/
EXPOSE 8000
ENTRYPOINT [ "bash", "scripts/docker-entry.sh" ]
CMD npm run prisma:apply && npm run prisma:generate && node dist/src/index.js
