CREATE TABLE `memberships` (
	`player_id` text PRIMARY KEY NOT NULL,
	`startup_id` text NOT NULL,
	`slot` integer NOT NULL,
	`locked` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`startup_id`) REFERENCES `startups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `startup_slot` ON `memberships` (`startup_id`,`slot`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`nickname` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`ticket_id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`score` integer NOT NULL,
	`cash` integer NOT NULL,
	`result` text NOT NULL,
	`version` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ranking` ON `runs` (`version`,`player_id`,`score`);--> statement-breakpoint
CREATE TABLE `startups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `startups_code_unique` ON `startups` (`code`);--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`seed` integer NOT NULL,
	`rules` text NOT NULL,
	`content` text NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `player_tickets` ON `tickets` (`player_id`,`created`);