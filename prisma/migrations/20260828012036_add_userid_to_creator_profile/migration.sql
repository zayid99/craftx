/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `creator_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `CoachMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SavedContentPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SavedIdea` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SavedSEO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SavedScript` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `UsageEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `VideoAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `creator_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CoachMessage" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SavedContentPlan" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SavedIdea" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SavedSEO" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SavedScript" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UsageEvent" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VideoAnalysis" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "creator_profiles" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "CoachMessage_userId_idx" ON "CoachMessage"("userId");

-- CreateIndex
CREATE INDEX "SavedContentPlan_userId_idx" ON "SavedContentPlan"("userId");

-- CreateIndex
CREATE INDEX "SavedIdea_userId_idx" ON "SavedIdea"("userId");

-- CreateIndex
CREATE INDEX "SavedSEO_userId_idx" ON "SavedSEO"("userId");

-- CreateIndex
CREATE INDEX "SavedScript_userId_idx" ON "SavedScript"("userId");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_idx" ON "UsageEvent"("userId");

-- CreateIndex
CREATE INDEX "VideoAnalysis_userId_idx" ON "VideoAnalysis"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_userId_key" ON "creator_profiles"("userId");
