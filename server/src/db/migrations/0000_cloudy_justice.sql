CREATE TABLE `merchants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`vpa` text NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`key` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` text,
	`note` text NOT NULL,
	`status` integer DEFAULT 0 NOT NULL,
	`merchant` text NOT NULL,
	FOREIGN KEY (`merchant`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE no action
);
