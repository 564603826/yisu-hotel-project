/*
  Warnings:

  - You are about to drop the column `images` on the `hotel` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `hotelimage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `hotelimage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `hotelimage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `HotelImage_roomType_idx` ON `hotelimage`;

-- DropIndex
DROP INDEX `HotelImage_type_idx` ON `hotelimage`;

-- AlterTable
ALTER TABLE `hotel` DROP COLUMN `images`;

-- AlterTable
ALTER TABLE `hotelimage` ADD COLUMN `createdBy` INTEGER NOT NULL,
    ADD COLUMN `fileSize` INTEGER NULL,
    ADD COLUMN `filename` VARCHAR(255) NULL,
    ADD COLUMN `mimeType` VARCHAR(100) NULL,
    ADD COLUMN `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `updatedBy` INTEGER NOT NULL,
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `hotelimage_hotelId_type_status_idx` ON `hotelimage`(`hotelId`, `type`, `status`);

-- CreateIndex
CREATE INDEX `hotelimage_hotelId_roomType_sortOrder_idx` ON `hotelimage`(`hotelId`, `roomType`, `sortOrder`);

-- CreateIndex
CREATE INDEX `hotelimage_type_status_idx` ON `hotelimage`(`type`, `status`);
