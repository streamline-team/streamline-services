CREATE TABLE `tag` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`background` varchar(9),
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tag_id` PRIMARY KEY(`id`),
	CONSTRAINT `tag_name_background_userId_unique` UNIQUE(`name`,`background`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text,
	`done` boolean NOT NULL DEFAULT false,
	`dueAt` datetime,
	`priority` tinyint NOT NULL DEFAULT 5,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskToTag` (
	`taskId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `taskToTag_taskId_tagId_pk` PRIMARY KEY(`taskId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authId` varchar(40) NOT NULL,
	`name` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `titleIdx` ON `task` (`title`);--> statement-breakpoint
CREATE INDEX `doneIdx` ON `task` (`done`);--> statement-breakpoint
CREATE INDEX `dueAtIdx` ON `task` (`dueAt`);--> statement-breakpoint
CREATE INDEX `priorityIdx` ON `task` (`priority`);--> statement-breakpoint
ALTER TABLE `tag` ADD CONSTRAINT `tag_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task` ADD CONSTRAINT `task_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskToTag` ADD CONSTRAINT `taskToTag_taskId_task_id_fk` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskToTag` ADD CONSTRAINT `taskToTag_tagId_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;