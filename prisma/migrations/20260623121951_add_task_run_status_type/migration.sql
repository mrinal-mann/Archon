/*
  Warnings:

  - Added the required column `updatedAt` to the `TaskRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskRun" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'queued',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'design',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
