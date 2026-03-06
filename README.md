# NSJWF Admin API

Built with Typescript, ExpressJS, Prisma, PostgreSQL

## Requirements

Either baremetal:

- NodeJS 22+
- PostgreSQL 16+

Or containers:

- Docker and Docker Compose

If you have NodeJS and PostgreSQL, it is not necessary to get Docker and vice versa.

## Local baremetal setup

Install dependencies:

```sh
$ npm i
```

Create `.env` file:

```
DATABASE_URL="postgresql://{your_username}:{your_password}@localhost:5432/{your_db}?schema=public"
NODE_ENV=dev
CORS="*"
ACCESS_TOKEN_SECRET={your_secret}
ACCESS_TOKEN_EXPIRE=86400s
PORT={your_port_number}
FILE_STORAGE="/path/to/folder"
```

It is crucial to keep the directory at `FILE_STORAGE` and all of its contents on the _same_ partition.

(Optional) Enable SQL logging in prisma-client.ts:

    const prisma = globalThis.prisma || new PrismaClient({log: ["query"]});

Run dev server:

```sh
npm run dev
```

Dev server will automatically restart when detecting changes to source code.

## Prisma Migration

After modify prisma/schema.prisma, run `npm run prisma:format` to format the file.

After formatting schema, run:

```sh
$ npm run prisma:draft
```

Review SQL scripts, modify if needed, then run:

```sh
$ npm run prisma:apply
```

After applying sql scripts, run:

```sh
$ npm run prisma:generate
```

## Docker setup

The default configuration in `container/compose.yml` is a sane default, although you can modify some of them as needed. The rest of this section assume this default.

### Credentials

From the project directory, create the directory `container/secrets/`. Create two files `.postgres_pw` and `.app_pw`. Each file contains a single line of password. The password in `.app_pw` will be used to connect to the database.

This should be the directory structure:

```sh
container/
├── compose.yml
├── pg16
│   └── ...
└── secrets
    ├── .app_pw
    └── .postgres_pw
dist/
node_modules/
prisma/
src/
...
```

### Environment file

For `FILE_STORAGE` in `.env`, use `"../uploads"`. For `PORT` in `.env`, use `8000`. For `DATABASE_URL` in `.env`, use `DATABASE_URL="postgresql://nsjwfbackend:<password>@pg16:5432/defaultdb?schema=public"`. For password, use the value defined in `container/secrets/.app_pw`.

### Set up

_Depending on how you installed Docker Compose, you may need to replace `docker compose` with `docker-compose` in below commands._

Create two storage volumes named `nsjwf-pg` and `nsjwf-uploads`.

```sh
$ docker volume create nsjwf-pg
$ docker volume create nsjwf-uploads
```

Start the services. After this, two images `postgres:<version>` and `node_backend` should be created (you can check using command `docker images`).

```sh
$ docker compose -f container/compose.yml up --watch
```

Remove containers:

```sh
$ docker compose -f container/compose.yml down
```

Nuke database and/or scanned uploads:

```sh
$ docker volume rm nsjwf-pg
$ docker volume rm nsjwf-uploads
```

### Import database

If you have an existing dump created by `pg_dump`, you can import to your local database. Before continuing, make sure you have run `docker compose up` successfully once to create the necessary user. Then, make sure there are no running containers.

In a terminal, bring up a postgres container:

```sh
$ docker run --volume nsjwf-pg:/var/lib/postgresql/data --name tempdb postgres:16
```

In another terminal, access to `psql` and empty the existing database:

```sh
$ docker exec -it tempdb psql -U postgres
psql (16.11 (Debian 16.11-1.pgdg13+1))
Type "help" for help.

postgres=# DROP DATABASE defaultdb;
DROP DATABASE
postgres=# CREATE DATABASE defaultdb WITH OWNER nsjwfbackend;
CREATE DATABASE
postgres=# \q
```

Assuming your dump is located at `./backup.dump`, use the following command to restore it:

```sh
$ docker exec -i tempdb pg_restore -d defaultdb -h localhost -U nsjwfbackend < backup.dump
```

## Deployment

### DigitalOcean

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

### Lightsail

Only follow these steps if GitHub Actions deployment doesn't work.

1. SSH to the VPS (via the browser-based client or terminal)

```sh
ssh bitnami@ip.address.or.host
```

2. Switch to user `nsjwfbackend`

```sh
su nsjwfbackend
```

3. Pull the code

```sh
cd ~/storage/backend
git pull
git switch main
```

3. Restart the backend

```sh
systemctl --user restart nsjwf
systemctl --user status
```

If status is all green, everything is good to go.

### Baremetal Lightsail initial setup

Assumptions:

1. The VPS is an Amazon Lightsail instance, created by Bitnami's NodeJS blueprint.
2. The VPS has a static IP and a registered domain name.
3. (Optional) You have an SSH client on the local device.

Steps:

1. Login to the Lightsail instance (via the browser-based client or terminal).
2. Install PostgreSQL.

```sh
# User: bitnami
sudo apt install postgresql
```

3. Create another user. This user will manage the backend. Follow the prompts to complete this action. _Make sure this user isn't a superuser/can't use `sudo`._

```sh
# User: bitnami
sudo adduser nsjwfbackend
```

4. Login to the new user (`nsjwfbackend` from now on) and create an SSH keypair. This is needed to pull the code from GitHub later on. Skip through all prompts by repeatedly pressing ENTER.

```sh
# User: bitnami
su nsjwfbackend
# User: nsjwfbackend
ssh-keygen -t ed25519 -C "some meaningful comment to identify this key"
```

5. Add the public key to your GitHub account: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account#adding-a-new-ssh-key-to-your-account

After this, create a database for the user, pull the code, setup `.env`, run it and test the API.

```sh
# User: bitnami
sudo -i -u postgres
createuser --interactive nsjwfbackend # Make sure to allow this user to create database

# User: nsjwfbackend
createdb dbname
cd ~
mkdir -p storage/backend/ && cd storage/backend/
git clone git@github.com:nhxv/nsjwf-admin-api.git .
npm i
nano .env # Or any editor you're comfortable with
npm run prisma:apply
npm run prisma:generate
npm run dev

# User: bitnami
curl -X GET http://localhost:3000/api/test/hello
curl -X GET http://localhost:3000/api/test/roles
```

6. Enable Apache to forward requests to the server. Make sure to edit `sample-vhost.conf` and `sample-https-vhost.conf` to point to the VPS domain name. See [docs](https://docs.bitnami.com/virtual-machine/infrastructure/nodejs/get-started/get-started/) for more details.

```sh
# User: bitnami
sudo cp /opt/bitnami/apache/conf/vhosts/sample-vhost.conf.disabled /opt/bitnami/apache/conf/vhosts/sample-vhost.conf
sudo cp /opt/bitnami/apache/conf/vhosts/sample-https-vhost.conf.disabled /opt/bitnami/apache/conf/vhosts/sample-https-vhost.conf
sudo /opt/bitnami/ctlscript.sh restart apache
```

7. Generate a certificate for the VPS to avoid the untrusted certificate warning: https://docs.bitnami.com/virtual-machine/faq/administration/generate-configure-certificate-letsencrypt/

After this, test the API from your local computer.

```
GET https://{domain_name}/api/test/hello
GET https://{domain_name}/api/test/roles
```

8. Add the backend to `systemd`

```sh
# User: nsjwfbackend
cd ~
mkdir -p .config/systemd/user/ && cd .config/systemd/user
nano nsjwf.service # See below for the content of this file
loginctl enable-linger
systemctl --user daemon-reload
systemctl --user enable nsjwf
systemctl --user start nsjwf
systemctl --user status
```

If status is all green, you can log out of the shell session and test the API again to make sure it still works.

Content of the `nsjwf.service` file:

```
[Unit]
Description=NSJWF app Node.js backend
Requires=postgresql
After=postgresql

[Service]
Type=simple
Restart=on-failure
WorkingDirectory=/home/nsjwfbackend/storage/backend/
ExecStart=/opt/bitnami/node/bin/npm run dev

[Install]
WantedBy=default.target
```

9. (Optional) Create an SSH keypair to log into the user `nsjwfbackend` directly instead of the privillege user `bitnami`. This is recommended especially if you use a database client (like DBeaver).

```sh
# On your local computer
ssh-keygen -t ed25519 -C "some comment"
# Copy the content of .pub file to clipboard

ssh bitnami@ip.address
su nsjwfbackend
cd ~
mkdir .ssh && cd .ssh
echo 'paste the content from the clipboard here' > authorized_keys

# Test to see if it works on your local computer
ssh nsjwfbackend@ip.address

# QoL to avoid remembering the IP address
# On your local computer
nano ~/.ssh/config # See below for content of this file
ssh nsjwfbackend@FooVPS
```

Content of `config`:

```
Host FooVPS
    Hostname ip.address.of.lightsail
    User nsjwfbackend
```

## Related

https://github.com/nhxv/nsjwf-admin
