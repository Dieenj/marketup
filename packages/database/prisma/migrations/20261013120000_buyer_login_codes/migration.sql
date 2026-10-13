-- CreateTable
CREATE TABLE "buyer_login_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_login_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buyer_login_codes_email_createdAt_idx" ON "buyer_login_codes"("email", "createdAt");

-- CreateIndex
CREATE INDEX "orders_buyerEmail_shopId_idx" ON "orders"("buyerEmail", "shopId");

