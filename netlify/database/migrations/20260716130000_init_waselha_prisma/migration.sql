-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "customerName" TEXT,
    "phone" TEXT,
    "productUrl" TEXT NOT NULL,
    "productName" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "productPrice" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "serviceTier" TEXT NOT NULL,
    "estimatedTotal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotePreset" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "fxToSar" DOUBLE PRECISION NOT NULL,
    "shippingPerKg" DOUBLE PRECISION NOT NULL,
    "serviceFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotePreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSession" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "chineseAddress" TEXT NOT NULL,
    "englishAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentCounter" (
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "ChinaShipment" (
    "id" SERIAL NOT NULL,
    "internalReference" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "customerCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "localTrackingNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "productPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "invoiceImageUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "weightKg" DOUBLE PRECISION,
    "lengthCm" DOUBLE PRECISION,
    "widthCm" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "actualWeightKg" DOUBLE PRECISION,
    "volumetricWeightKg" DOUBLE PRECISION,
    "chargeableWeightKg" DOUBLE PRECISION,
    "customerNote" TEXT,
    "internalNote" TEXT,
    "shippingFee" DOUBLE PRECISION,
    "internationalTrackingNumber" TEXT,
    "warehouseArrivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChinaShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentPhoto" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentAuditLog" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "adminId" INTEGER,
    "adminEmail" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "adminUserId" INTEGER,
    "shipmentId" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerId_key" ON "Customer"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSession_token_key" ON "CustomerSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ChinaShipment_internalReference_key" ON "ChinaShipment"("internalReference");

-- CreateIndex
CREATE INDEX "ChinaShipment_customerCode_idx" ON "ChinaShipment"("customerCode");

-- CreateIndex
CREATE INDEX "ChinaShipment_localTrackingNumber_idx" ON "ChinaShipment"("localTrackingNumber");

-- CreateIndex
CREATE INDEX "ChinaShipment_status_idx" ON "ChinaShipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChinaShipment_customerId_localTrackingNumber_key" ON "ChinaShipment"("customerId", "localTrackingNumber");

-- CreateIndex
CREATE INDEX "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentPhoto_shipmentId_idx" ON "ShipmentPhoto"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "ShipmentAuditLog_shipmentId_idx" ON "ShipmentAuditLog"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentAuditLog_adminId_idx" ON "ShipmentAuditLog"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_adminUserId_isRead_idx" ON "Notification"("adminUserId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_shipmentId_idx" ON "Notification"("shipmentId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- AddForeignKey
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChinaShipment" ADD CONSTRAINT "ChinaShipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "ChinaShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentPhoto" ADD CONSTRAINT "ShipmentPhoto_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "ChinaShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentAuditLog" ADD CONSTRAINT "ShipmentAuditLog_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "ChinaShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentAuditLog" ADD CONSTRAINT "ShipmentAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "ChinaShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

