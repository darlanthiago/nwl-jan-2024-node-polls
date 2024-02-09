/*
  Warnings:

  - You are about to drop the `Poll` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Poll";

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);
