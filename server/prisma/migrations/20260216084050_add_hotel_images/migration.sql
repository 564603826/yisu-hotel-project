-- CreateTable
CREATE TABLE `HotelImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hotelId` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `type` ENUM('hotel_main', 'hotel_room', 'hotel_banner', 'user_avatar') NOT NULL DEFAULT 'hotel_main',
    `roomType` VARCHAR(100) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HotelImage_hotelId_idx`(`hotelId`),
    INDEX `HotelImage_type_idx`(`type`),
    INDEX `HotelImage_roomType_idx`(`roomType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HotelImage` ADD CONSTRAINT `HotelImage_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `Hotel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
