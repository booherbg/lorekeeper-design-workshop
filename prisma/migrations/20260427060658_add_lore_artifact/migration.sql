-- CreateTable
CREATE TABLE "LoreArtifact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worldId" INTEGER NOT NULL,
    "storyId" INTEGER NOT NULL,
    "characterId" INTEGER,
    "locationId" INTEGER,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoreArtifact_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LoreArtifact_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LoreArtifact_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LoreArtifact_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
