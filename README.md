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

(Optional) Enable SQL logging in prisma-client.ts:

    const prisma = globalThis.prisma || new PrismaClient({log: ["query"]});    

Run dev server:
    
    npm run dev

Dev server will automatically restart when detecting changes to source code.    

## Migration
After modify prisma/schema.prisma, run:

    npm run prisma:format

After formatting schema, run:

    npm run prisma:draft

Review SQL scripts, modify if needed, then run:

    npm run prisma:apply

After applying sql scripts, run:

    npm run prisma:generate

## Deployment
Create Managed Database on Digital Ocean, setup App in App platform as trust sources, then copy connection string:

    postgresql://{username}:{password}@db-postgresql-{your_region}.b.db.ondigitalocean.com:{your_port}/defaultdb?sslmode=require

Comment out SQL logging in prisma-client.ts:

    // const prisma = globalThis.prisma || new PrismaClient({log: ["query"]});

Link repo on App Platform, then setup env variables:

    DATABASE_URL={paste_db_connection_string_here}
    NODE_ENV=stage
    CORS="https://nsjwf.vercel.app"
    ACCESS_TOKEN_SECRET={your_secret}
    ACCESS_TOKEN_EXPIRE=86400s
    PORT={your_port_number}

After the app finished deployment, run db migration:

    npm run prisma:deploy

Make call to test API to check if it's working:

    GET {your_url}.ondigitalocean.app/api/test/hello
    GET {your_url}.ondigitalocean.app/api/test/roles

## Related
https://github.com/nhxv/sjwh-admin        