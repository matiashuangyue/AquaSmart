-- AlterTable
ALTER TABLE "Pool" ADD COLUMN "ancho" REAL;
ALTER TABLE "Pool" ADD COLUMN "estadoPileta" TEXT DEFAULT 'OK';
ALTER TABLE "Pool" ADD COLUMN "largo" REAL;
ALTER TABLE "Pool" ADD COLUMN "profundidadPromedio" REAL;
ALTER TABLE "Pool" ADD COLUMN "volumen" REAL;
