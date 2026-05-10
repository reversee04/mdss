/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `userRole` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "userRole" AS ENUM ('system_admin', 'data_analyst', 'ministry_user');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "userRole" TEXT NOT NULL;
