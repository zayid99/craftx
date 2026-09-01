-- CreateTable
CREATE TABLE "SavedIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "audience" TEXT,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedIdea_pkey" PRIMARY KEY ("id")
);
