-- CreateTable
CREATE TABLE "SavedScript" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "duration" TEXT,
    "tone" TEXT,
    "audience" TEXT,
    "hookStyle" TEXT,
    "hooks" JSONB NOT NULL,
    "script" JSONB NOT NULL,
    "altEndings" JSONB NOT NULL,
    "platformNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedScript_pkey" PRIMARY KEY ("id")
);
