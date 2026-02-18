-- AlterTable
ALTER TABLE `hotel` ADD COLUMN `auditInfo` VARCHAR(500) NULL,
    ADD COLUMN `bannerDesc` VARCHAR(200) NULL,
    ADD COLUMN `bannerSort` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `bannerTitle` VARCHAR(100) NULL,
    ADD COLUMN `draftData` JSON NULL,
    ADD COLUMN `isBanner` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Hotel_isBanner_idx` ON `Hotel`(`isBanner`);
