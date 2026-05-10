/*
  Warnings:

  - Changed the type of `userRole` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('system_admin', 'data_analyst', 'ministry_user');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userRole",
ADD COLUMN     "userRole" "UserRole" NOT NULL;

-- DropEnum
DROP TYPE "userRole";
