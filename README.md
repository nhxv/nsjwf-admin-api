# SJWH Admin API
Built with Typescript, ExpressJS, Prisma, PostgreSQL

## Requirements
    NodeJS 18+
    PostgreSQL 15+

## Local server setup
Install dependencies:

    npm i

Create .env in root folder:

    DATABASE_URL="postgresql://username:password@localhost:5432/db?schema=public"
    NODE_ENV=dev
    PORT=8000
Run local dev server:
    
    npm run dev
Local dev server will automatically restart after detecting changes.    

## Migration
After modify prisma/schema.prisma, run:

    npm run prisma:migration-draft

Review SQL scripts, modify if needed, then run:

    npm run prisma:migration-apply

## Deploy to Digital Ocean