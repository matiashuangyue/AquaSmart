-- AlterTable
ALTER TABLE "Threshold" ADD COLUMN "estadoUmbral" TEXT DEFAULT 'OK';
ALTER TABLE "Threshold" ADD COLUMN "modificadoPor" TEXT;
ALTER TABLE "Threshold" ADD COLUMN "notas" TEXT;
ALTER TABLE "Threshold" ADD COLUMN "version" INTEGER DEFAULT 1;
