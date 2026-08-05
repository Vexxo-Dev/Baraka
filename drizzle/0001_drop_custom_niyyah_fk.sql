PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_custom_niyyah_options` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`text_en` text NOT NULL,
	`text_ar` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_custom_niyyah_options`("id", "activity_id", "text_en", "text_ar", "created_at") SELECT "id", "activity_id", "text_en", "text_ar", "created_at" FROM `custom_niyyah_options`;--> statement-breakpoint
DROP TABLE `custom_niyyah_options`;--> statement-breakpoint
ALTER TABLE `__new_custom_niyyah_options` RENAME TO `custom_niyyah_options`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
