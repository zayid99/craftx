-- CreateTable
CREATE TABLE "SavedSEO" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "titles" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT[],
    "hashtags" TEXT[],
    "searchIntent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSEO_pkey" PRIMARY KEY ("id")
);
