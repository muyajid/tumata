ALTER TABLE "loans" ADD COLUMN "handedOverBy" uuid;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "handedOverAt" timestamp;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "rejectedReason" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_handedOverBy_users_id_fk" FOREIGN KEY ("handedOverBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_loans_createdAt" ON "loans" USING btree ("createdAt");--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."loans" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
UPDATE "loans" SET "status" = CASE "status"
  WHEN 'pending'  THEN 'Menunggu'
  WHEN 'borrowed' THEN 'Dipinjam'
  WHEN 'rejected' THEN 'Ditolak'
  WHEN 'returned' THEN 'Dikembalikan'
  ELSE 'Dikembalikan'
END;--> statement-breakpoint
DROP TYPE "public"."loanStatus";--> statement-breakpoint
CREATE TYPE "public"."loanStatus" AS ENUM('Menunggu', 'Disetujui', 'Ditolak', 'Dipinjam', 'Dikembalikan', 'Dibatalkan');--> statement-breakpoint
ALTER TABLE "public"."loans" ALTER COLUMN "status" SET DATA TYPE "public"."loanStatus" USING "status"::"public"."loanStatus";--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "status" SET DEFAULT 'Menunggu';