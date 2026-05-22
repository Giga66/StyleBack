-- CreateTable
CREATE TABLE "MerchantSettings" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "replyToEmail" TEXT,
    "brandColor" TEXT DEFAULT '#000000',
    "delay1Hour" INTEGER NOT NULL DEFAULT 1,
    "delay2Hour" INTEGER NOT NULL DEFAULT 24,
    "delay3Hour" INTEGER NOT NULL DEFAULT 72,
    "discountCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "checkoutToken" TEXT NOT NULL,
    "customerEmail" TEXT,
    "cartContents" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sequenceStep" INTEGER NOT NULL,
    "scheduledSendAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailSchedule_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "AbandonedCart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_checkoutToken_key" ON "AbandonedCart"("checkoutToken");
