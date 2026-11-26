ALTER TABLE "loans" RENAME COLUMN "processedBy" TO "reviewedBy";--> statement-breakpoint
ALTER TABLE "loans" RENAME COLUMN "checkedBy" TO "returnCheckedBy";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_departmentId_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_locationId_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "locations" DROP CONSTRAINT "locations_departmentId_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "loans" DROP CONSTRAINT "loans_processedBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "loans" DROP CONSTRAINT "loans_checkedBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "loans" DROP CONSTRAINT "loans_handedOverBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "borrowedDate" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "returnDate" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "actualReturnDate" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "handedOverAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "reviewedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "returnCheckedAt" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items" ADD CONSTRAINT "items_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_departmentId_departments_id_fk" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_returnCheckedBy_users_id_fk" FOREIGN KEY ("returnCheckedBy") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_handedOverBy_users_id_fk" FOREIGN KEY ("handedOverBy") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
