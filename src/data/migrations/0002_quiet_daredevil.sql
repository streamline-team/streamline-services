ALTER TABLE `tag` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `tag` MODIFY COLUMN `updatedAt` timestamp(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `task` MODIFY COLUMN `dueAt` datetime(3);--> statement-breakpoint
ALTER TABLE `task` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `task` MODIFY COLUMN `updatedAt` timestamp(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `createdAt` timestamp(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `updatedAt` timestamp(3) NOT NULL DEFAULT (now());