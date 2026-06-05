-- AlterTable
ALTER TABLE "Reference" ADD COLUMN     "screenshotUrl" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
