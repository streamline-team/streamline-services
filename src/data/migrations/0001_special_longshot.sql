ALTER TABLE `taskToTag` DROP FOREIGN KEY `taskToTag_taskId_task_id_fk`;
--> statement-breakpoint
ALTER TABLE `taskToTag` ADD CONSTRAINT `taskToTag_taskId_task_id_fk` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE cascade ON UPDATE no action;