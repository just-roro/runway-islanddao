CREATE TABLE `ranking_leaders` (
	`version` text NOT NULL,
	`kind` text NOT NULL,
	`entity_id` text NOT NULL,
	`since` integer,
	`observed_at` integer NOT NULL,
	PRIMARY KEY(`version`, `kind`, `entity_id`)
);
--> statement-breakpoint
CREATE TABLE `ranking_tracking` (
	`version` text NOT NULL,
	`kind` text NOT NULL,
	`started_at` integer NOT NULL,
	PRIMARY KEY(`version`, `kind`)
);
