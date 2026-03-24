CREATE TABLE `chat_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chatId` varchar(255) NOT NULL,
	`workspaceId` varchar(255) NOT NULL,
	`agentId` varchar(255),
	`agentName` text,
	`userName` text,
	`humanTalk` boolean NOT NULL DEFAULT false,
	`finished` boolean NOT NULL DEFAULT false,
	`unReadCount` int NOT NULL DEFAULT 0,
	`lastMessageTime` timestamp,
	`data` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_cache_chatId_unique` UNIQUE(`chatId`)
);
--> statement-breakpoint
CREATE TABLE `gptmaker_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiToken` text NOT NULL,
	`workspaceId` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gptmaker_config_id` PRIMARY KEY(`id`)
);
