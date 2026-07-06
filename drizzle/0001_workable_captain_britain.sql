CREATE TABLE `civic_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('institutional','commercial','tourism','association','services') NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`description` text,
	`address` text,
	`lat` decimal(10,8),
	`lng` decimal(11,8),
	`phone` varchar(50),
	`email` varchar(320),
	`website` varchar(500),
	`hours` json,
	`services` json,
	`trustLevel` enum('pending','verified','suspended') NOT NULL DEFAULT 'pending',
	`operatorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `civic_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`channel` enum('web','whatsapp','telegram') NOT NULL DEFAULT 'web',
	`riskLevel` enum('green','yellow','red'),
	`status` enum('active','escalated','resolved','closed') NOT NULL DEFAULT 'active',
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crawl_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(500) NOT NULL,
	`status` enum('success','error','skipped') NOT NULL,
	`entriesAdded` int DEFAULT 0,
	`entriesUpdated` int DEFAULT 0,
	`errorMessage` text,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crawl_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`assignedNodeId` int,
	`assignedOperatorId` int,
	`reason` text,
	`context` text,
	`status` enum('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceNodeId` int,
	`category` varchar(100),
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`sourceUrl` varchar(500),
	`verified` boolean DEFAULT false,
	`validUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','operator','system') NOT NULL,
	`content` text NOT NULL,
	`riskLevel` enum('green','yellow','red'),
	`sources` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','operator','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `assignedNodeId` int;