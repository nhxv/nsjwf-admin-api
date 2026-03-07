FROM node:22-slim AS base
# Required for Prisma
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /usr/local/app/
RUN mkdir uploads backend && chown node:node uploads/ backend/
WORKDIR /usr/local/app/backend
USER node

### Dev
FROM base AS deps
COPY --chown=node package*.json ./
RUN npm i

FROM base AS dev
USER node
WORKDIR /usr/local/app/backend
COPY --from=deps /usr/local/app/backend/node_modules ./node_modules
COPY --chown=node package*.json ./
# Have to copy this BEFORE running generate
# Relevant discussion: https://github.com/prisma/prisma/issues/2584#issuecomment-1411794452
COPY --chown=node prisma ./prisma/
COPY --chown=node src ./src/
EXPOSE 8000
CMD npm run prisma:apply && npm run prisma:generate && npm run dev


### Prod
FROM base AS build-prod
# Need tsc to compile to js
COPY --chown=node package*.json ./
COPY --chown=node prisma/ ./prisma/
RUN npm pkg delete scripts.prepare && npm i && npm run prisma:generate
COPY --chown=node src ./src/
COPY --chown=node tsconfig.json ./
RUN npm run build

# Remove dev dependencies
FROM base AS deps-prod
COPY --from=build-prod /usr/local/app/backend/package*.json ./
COPY --from=build-prod /usr/local/app/backend/dist ./
RUN npm i --omit=dev

FROM base AS prod
COPY --from=deps-prod /usr/local/app/backend/node_modules ./node_modules
COPY --from=build-prod /usr/local/app/backend/dist ./dist
# No need to copy source files.
COPY --chown=node package*.json ./
COPY --chown=node prisma ./prisma/
EXPOSE 8000
CMD npm run prisma:apply && npm run prisma:generate && node dist/src/index.js
