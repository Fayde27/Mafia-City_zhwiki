ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "iconPosition"    TEXT DEFAULT '50% 50%';
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "imagePosition"   TEXT DEFAULT '50% 50%';
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "summary"         TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "unlockCondition" TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "upgradeLevels"   TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "isFeatured"      BOOLEAN DEFAULT false;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "publishedAt"     TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "CharacterSkin" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL REFERENCES "Character"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  art TEXT,
  icon TEXT,
  bonuses TEXT,
  acquisition TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "CharacterSkin_characterId_idx" ON "CharacterSkin"("characterId");

CREATE TABLE IF NOT EXISTS "CharacterSkinBond" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL REFERENCES "Character"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "skinIds" TEXT NOT NULL DEFAULT '[]',
  bonuses TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "CharacterSkinBond_characterId_idx" ON "CharacterSkinBond"("characterId");

CREATE TABLE IF NOT EXISTS "CharacterTeamComp" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL REFERENCES "Character"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reason TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "CharacterTeamComp_characterId_idx" ON "CharacterTeamComp"("characterId");

CREATE TABLE IF NOT EXISTS "CharacterTeamCompMember" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "teamCompId" UUID NOT NULL REFERENCES "CharacterTeamComp"(id) ON DELETE CASCADE,
  "memberId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "CharacterTeamCompMember_teamCompId_idx" ON "CharacterTeamCompMember"("teamCompId");

CREATE TABLE IF NOT EXISTS "CharacterBloodBond" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL REFERENCES "Character"(id) ON DELETE CASCADE,
  "requiredStars" INTEGER NOT NULL DEFAULT 0,
  bonuses TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "CharacterBloodBond_characterId_idx" ON "CharacterBloodBond"("characterId");

CREATE TABLE IF NOT EXISTS "CharacterBloodBondMember" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "bloodBondId" UUID NOT NULL REFERENCES "CharacterBloodBond"(id) ON DELETE CASCADE,
  "memberId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "CharacterBloodBondMember_bloodBondId_idx" ON "CharacterBloodBondMember"("bloodBondId");

CREATE TABLE IF NOT EXISTS "CharacterEquipment" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL REFERENCES "Character"(id) ON DELETE CASCADE,
  "equipmentId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "CharacterEquipment_characterId_idx" ON "CharacterEquipment"("characterId");

CREATE TABLE IF NOT EXISTS "CharacterArticle" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "characterId" UUID NOT NULL REFERENCES "Character"(id) ON DELETE CASCADE,
  "articleId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "CharacterArticle_characterId_idx" ON "CharacterArticle"("characterId");
