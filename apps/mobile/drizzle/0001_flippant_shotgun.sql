ALTER TABLE `events` RENAME TO `__old_events`;--> statement-breakpoint
CREATE TABLE `timers` (
	`id` text PRIMARY KEY NOT NULL,
	`duration_sec` integer NOT NULL,
	`remaining_sec` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `archives` (
	`id` text PRIMARY KEY NOT NULL,
	`timer_id` text,
	`start_at` integer DEFAULT (unixepoch()) NOT NULL,
	`end_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`timer_id`) REFERENCES `timers`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "start_at_before_end_at" CHECK("archives"."start_at" <= "archives"."end_at")
);
--> statement-breakpoint
INSERT INTO `archives`("id", "start_at", "end_at", "created_at", "updated_at") SELECT CAST("id" AS TEXT), "start_at", "end_at", unixepoch(), unixepoch() FROM `__old_events`;--> statement-breakpoint
DROP TABLE `__old_events`;--> statement-breakpoint
CREATE INDEX `archives_timer_id_idx` ON `archives` (`timer_id`);--> statement-breakpoint
CREATE INDEX `archives_start_at_idx` ON `archives` (`start_at`);--> statement-breakpoint
CREATE INDEX `archives_end_at_idx` ON `archives` (`end_at`);
