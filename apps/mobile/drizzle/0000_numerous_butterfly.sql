CREATE TABLE `events` (
	`id` integer PRIMARY KEY NOT NULL,
	`start_at` integer DEFAULT (unixepoch()) NOT NULL,
	`end_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "start_at_before_end_at" CHECK("events"."start_at" <= "events"."end_at")
);
