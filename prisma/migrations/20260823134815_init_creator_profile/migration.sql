-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "audience" TEXT,
    "targetMarket" TEXT,
    "primaryPlatform" TEXT NOT NULL,
    "secondaryPlatforms" TEXT[],
    "contentFormat" TEXT,
    "goals" TEXT,
    "experienceLevel" TEXT,
    "contentStyle" TEXT,
    "contentPillars" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);
