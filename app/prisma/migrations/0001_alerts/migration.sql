-- CreateTable
CREATE TABLE "Alert" (
    "id" STRING NOT NULL,
    "eventId" STRING NOT NULL,
    "severity" STRING NOT NULL,
    "status" STRING NOT NULL,
    "source" STRING NOT NULL,
    "type" STRING NOT NULL,
    "title" STRING NOT NULL,
    "description" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertHistory" (
    "id" STRING NOT NULL,
    "alertId" STRING NOT NULL,
    "action" STRING NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" STRING NOT NULL,
    "status" STRING NOT NULL,
    "source" STRING NOT NULL,
    "message" STRING NOT NULL,
    "data" JSONB,

    CONSTRAINT "AlertHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
