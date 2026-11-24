-- =============================================================
-- Mini Whiteboard — Migration: studentName + flag/praise fields
-- Brings an existing mwb_answer table up to the current schema.sql
-- (adds studentName, notifyType, notifiedAt if not already present).
-- Safe to run multiple times — each column is only added if missing.
-- Compatible with MariaDB (Hostinger) and MySQL (Dreamhost).
-- =============================================================

USE `mwb`;

-- studentName: required name shown on each answer card.
-- Existing rows get '' — there is no way to recover a name for them.
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mwb_answer' AND COLUMN_NAME = 'studentName'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE mwb_answer ADD COLUMN studentName VARCHAR(50) NOT NULL DEFAULT '''' AFTER studentToken',
    'SELECT ''studentName already exists'' AS skipped'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- notifyType: pending flag/praise notification for checkNotification.php to deliver and clear.
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mwb_answer' AND COLUMN_NAME = 'notifyType'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE mwb_answer ADD COLUMN notifyType VARCHAR(20) NULL COMMENT ''Pending notification for the originating student: warning | praise'' AFTER updatedAt',
    'SELECT ''notifyType already exists'' AS skipped'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- notifiedAt: when that notification was sent.
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mwb_answer' AND COLUMN_NAME = 'notifiedAt'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE mwb_answer ADD COLUMN notifiedAt DATETIME NULL AFTER notifyType',
    'SELECT ''notifiedAt already exists'' AS skipped'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify
DESCRIBE mwb_answer;
