-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('merchant', 'admin') NOT NULL DEFAULT 'merchant',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hotel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nameZh` VARCHAR(100) NOT NULL,
    `nameEn` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `starRating` INTEGER NOT NULL,
    `roomTypes` JSON NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `openDate` DATE NOT NULL,
    `nearbyAttractions` VARCHAR(191) NULL,
    `nearbyTransport` VARCHAR(191) NULL,
    `nearbyMalls` VARCHAR(191) NULL,
    `discounts` JSON NULL,
    `images` JSON NULL,
    `description` VARCHAR(191) NULL,
    `status` ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'offline') NOT NULL DEFAULT 'draft',
    `rejectReason` VARCHAR(255) NULL,
    `creatorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Hotel_creatorId_key`(`creatorId`),
    INDEX `Hotel_status_idx`(`status`),
    INDEX `Hotel_starRating_idx`(`starRating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Hotel` ADD CONSTRAINT `Hotel_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
