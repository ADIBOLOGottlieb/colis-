-- CreateTable
CREATE TABLE `ad_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `advertiserName` VARCHAR(191) NOT NULL,
    `category` ENUM('airline', 'gaming', 'travel', 'fintech', 'transport', 'insurance', 'other') NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `targetUrl` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `budget` DOUBLE NOT NULL,
    `costPerClick` DOUBLE NOT NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ad_campaigns_isActive_startDate_endDate_idx`(`isActive`, `startDate`, `endDate`),
    INDEX `ad_campaigns_category_priority_idx`(`category`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad_impressions` (
    `id` VARCHAR(191) NOT NULL,
    `adCampaignId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `placement` VARCHAR(191) NOT NULL,
    `ipHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ad_impressions_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `ad_impressions_adCampaignId_createdAt_idx`(`adCampaignId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad_clicks` (
    `id` VARCHAR(191) NOT NULL,
    `adCampaignId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `placement` VARCHAR(191) NOT NULL,
    `ipHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ad_clicks_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `ad_clicks_adCampaignId_createdAt_idx`(`adCampaignId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ad_impressions` ADD CONSTRAINT `ad_impressions_adCampaignId_fkey` FOREIGN KEY (`adCampaignId`) REFERENCES `ad_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_clicks` ADD CONSTRAINT `ad_clicks_adCampaignId_fkey` FOREIGN KEY (`adCampaignId`) REFERENCES `ad_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
