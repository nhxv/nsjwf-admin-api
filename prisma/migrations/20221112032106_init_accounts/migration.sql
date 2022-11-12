-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(32) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "password" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- InsertRoles
INSERT INTO "Role" ("name") VALUES ('MASTER');
INSERT INTO "Role" ("name") VALUES ('ADMIN');
INSERT INTO "Role" ("name") VALUES ('OPERATOR');

-- InsertAccounts
INSERT INTO "Account" ("username", "password", "role_id") VALUES ('master', '$2a$12$yWXj3gkF0uMDlvls09ENJeXn.msNC6rZgj2iasbOKhU8hwM2ntcm.', 1);
INSERT INTO "Account" ("username", "password", "role_id") VALUES ('admin', '$2a$12$i35ADGtEo2hjdjvvJQr0dO04wOG7sdgfqdKFKNXK692plI0uFJh.W', 2);
INSERT INTO "Account" ("username", "password", "role_id") VALUES ('operator', '$2a$12$vNuHRUspEasgt7SqAV1yy.i7YLuBVw5bXFFynF/MRzJmiRpnjnWSS', 3);