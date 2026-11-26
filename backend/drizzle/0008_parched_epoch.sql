git commit -m "refactor: restructure backend into monorepo folder"
CREATE TYPE "public"."loanStatus" AS ENUM('pending', 'borrowed', 'rejected', 'returned');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"unitId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"purpose" varchar(255) NOT NULL,
	"borrowedDate" timestamp NOT NULL,
	"returnDate" timestamp NOT NULL,
	"actualReturnDate" timestamp,
	"status" "loanStatus" DEFAULT 'pending' NOT NULL,
	"processedBy" uuid,
	"checkedBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "returnImages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loanId" uuid NOT NULL,
	"imgUrl" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_unitId_units_id_fk" FOREIGN KEY ("unitId") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_processedBy_users_id_fk" FOREIGN KEY ("processedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_checkedBy_users_id_fk" FOREIGN KEY ("checkedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "returnImages" ADD CONSTRAINT "returnImages_loanId_loans_id_fk" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_loans_unitId" ON "loans" USING btree ("unitId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_loans_userId" ON "loans" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_returnImages_loanId" ON "returnImages" USING btree ("loanId");