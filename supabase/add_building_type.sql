ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "buildingType" TEXT NOT NULL DEFAULT 'inner';
CREATE INDEX IF NOT EXISTS "Building_buildingType_idx" ON "Building"("buildingType");
