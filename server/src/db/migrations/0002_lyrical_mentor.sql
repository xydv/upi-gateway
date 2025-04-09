PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` text,
	`note` text NOT NULL,
	`status` integer DEFAULT 0 NOT NULL,
	`timestamp` integer NOT NULL,
	`merchant` text NOT NULL,
	FOREIGN KEY (`merchant`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_requests`("id", "amount", "note", "status", "timestamp", "merchant") SELECT "id", "amount", "note", "status", "timestamp", "merchant" FROM `requests`;--> statement-breakpoint
DROP TABLE `requests`;--> statement-breakpoint
ALTER TABLE `__new_requests` RENAME TO `requests`;--> statement-breakpoint
PRAGMA foreign_keys=ON;