-- CreateTable
CREATE TABLE "SavedContentPlan" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "goals" TEXT,
    "durationDays" INTEGER NOT NULL,
    "autoFill" BOOLEAN NOT NULL DEFAULT false,
    "pillars" TEXT[],
    "days" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedContentPlan_pkey" PRIMARY KEY ("id")
);
