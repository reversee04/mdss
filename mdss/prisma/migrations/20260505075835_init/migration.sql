/*
  Warnings:

  - Added the required column `employment_no` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employment_no" VARCHAR(50) NOT NULL;
