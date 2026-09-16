-- CreateTable
CREATE TABLE "SavedHookSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "audience" TEXT,
    "hooks" JSONB NOT NULL,
    "titles" JSONB NOT NULL,
    "starredHooks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "starredTitles" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedHookSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedHookSet_userId_idx" ON "SavedHookSet"("userId");
