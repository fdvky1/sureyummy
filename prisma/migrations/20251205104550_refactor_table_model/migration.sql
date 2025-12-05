-- Convert any RESERVED status to AVAILABLE before migration
UPDATE "Table" SET "status" = 'AVAILABLE' WHERE "status" = 'RESERVED';

-- AlterEnum: Remove RESERVED from TableStatus
BEGIN;
CREATE TYPE "TableStatus_new" AS ENUM ('AVAILABLE', 'OCCUPIED', 'OUT_OF_SERVICE');
ALTER TABLE "Table" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Table" ALTER COLUMN "status" TYPE "TableStatus_new" USING ("status"::text::"TableStatus_new");
ALTER TYPE "TableStatus" RENAME TO "TableStatus_old";
ALTER TYPE "TableStatus_new" RENAME TO "TableStatus";
DROP TYPE "TableStatus_old";
ALTER TABLE "Table" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- Add name column with temporary default to migrate existing data
ALTER TABLE "Table" ADD COLUMN "name" TEXT;

-- Migrate existing data: use 'Meja {number}' as name
UPDATE "Table" SET "name" = 'Meja ' || "number"::text WHERE "name" IS NULL;

-- Make name required
ALTER TABLE "Table" ALTER COLUMN "name" SET NOT NULL;

-- Add unique constraint on name
CREATE UNIQUE INDEX "Table_name_key" ON "Table"("name");

-- Drop old columns (commented out for safety)
-- Future: when code field is needed for reservation, it can be added back
ALTER TABLE "Table" DROP COLUMN "number";
ALTER TABLE "Table" DROP COLUMN "code";
