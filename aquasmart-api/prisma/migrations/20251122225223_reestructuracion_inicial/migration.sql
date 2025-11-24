/*
  Warnings:

  - You are about to drop the `ActionLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `History` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Measurement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ActionLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "History";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Measurement";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SensorLectura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "fechaHora" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SensorLectura_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parametro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lecturaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    CONSTRAINT "Parametro_lecturaId_fkey" FOREIGN KEY ("lecturaId") REFERENCES "SensorLectura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccionCorrectiva" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertaId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipoAccion" TEXT NOT NULL,
    "fechaCorreccion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "AccionCorrectiva_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "Alert" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccionCorrectiva_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccionCorrectiva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Historial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resumen" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accionId" TEXT NOT NULL,
    "poolId" TEXT,
    "userId" TEXT,
    CONSTRAINT "Historial_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES "AccionCorrectiva" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Historial_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Historial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AccionCorrectiva_alertaId_key" ON "AccionCorrectiva"("alertaId");
