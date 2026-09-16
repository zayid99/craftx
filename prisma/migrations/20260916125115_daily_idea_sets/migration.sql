-- CreateTable
CREATE TABLE "DailyIdeaSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "ideas" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyIdeaSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyIdeaSet_userId_idx" ON "DailyIdeaSet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyIdeaSet_userId_date_key" ON "DailyIdeaSet"("userId", "date");
