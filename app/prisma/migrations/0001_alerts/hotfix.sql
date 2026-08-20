ALTER TABLE "Alert" SET (schema_locked = false);
ALTER TABLE "AlertHistory" SET (schema_locked = false);

ALTER TABLE "AlertHistory"
ADD CONSTRAINT "AlertHistory_alertId_fkey"
FOREIGN KEY ("alertId") REFERENCES "Alert"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "AlertHistory" SET (schema_locked = true);
ALTER TABLE "Alert" SET (schema_locked = true);