# SJWH Admin API
Built with Typescript, ExpressJS, Prisma, PostgreSQL

## Requirements
    NodeJS 18+
    PostgreSQL 15+

## Local setup
Install dependencies:

    npm i

Create .env file:

    DATABASE_URL="postgresql://{your_username}:{your_password}@localhost:5432/{your_db}?schema=public"
    NODE_ENV=dev
    CORS="*"
    ACCESS_TOKEN_SECRET={your_secret}
    ACCESS_TOKEN_EXPIRE=86400s
    PORT={your_port_number}

Run dev server:
    
    npm run dev

Dev server will automatically restart when detecting changes to source code.    

## Migration
After modify prisma/schema.prisma, run:

    npm run prisma:migration-draft

Review SQL scripts, modify if needed, then run:

    npm run prisma:migration-apply

After applying sql scripts, run:

    npm run prisma:generate

## Deployment