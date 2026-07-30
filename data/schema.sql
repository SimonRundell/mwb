-- =============================================================
-- Mini Whiteboard — Complete Database Schema
-- Compatible with MariaDB (Laragon)
-- Run this to create a fresh installation.
-- =============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `mwb`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `mwb`;

-- ----------------------------
-- mwb_user — teacher accounts
-- Students are anonymous; only teachers log in.
-- ----------------------------
DROP TABLE IF EXISTS `mwb_user`;
CREATE TABLE `mwb_user` (
    `id`           INT          NOT NULL AUTO_INCREMENT,
    `email`        VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `teacherName`  VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB
  CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;

-- Default teacher account (password: 1234 — change immediately)
-- MD5('1234') = 81dc9bdb52d04dc20036dbd8313ed055
INSERT INTO `mwb_user` (`email`, `passwordHash`, `teacherName`)
VALUES ('name@school.ac.uk', '81dc9bdb52d04dc20036dbd8313ed055', 'Administrator');

-- ----------------------------
-- mwb_question — hinge questions, one stable code per question
-- isActive/launchedAt/endedAt track the live join window; the code
-- itself never changes between launches.
-- ----------------------------
DROP TABLE IF EXISTS `mwb_question`;
CREATE TABLE `mwb_question` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `questionCode`  VARCHAR(10)  NOT NULL,
    `questionTitle` VARCHAR(255) NOT NULL,
    `questionHtml`  LONGTEXT     NOT NULL,
    `teacherId`     INT          NOT NULL COMMENT 'mwb_user.id',
    `isActive`      TINYINT      NOT NULL DEFAULT 0 COMMENT '1 = currently accepting answers',
    `launchedAt`    DATETIME         NULL,
    `endedAt`       DATETIME         NULL,
    `createdAt`     DATETIME     NOT NULL,
    `updatedAt`     DATETIME     NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_questionCode` (`questionCode`),
    INDEX `idx_teacherId` (`teacherId`)
) ENGINE=InnoDB
  CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- mwb_answer — one editable row per student per question launch.
-- studentToken is a random value generated client-side; the unique
-- key makes submission an upsert so a student can revise their answer.
-- ----------------------------
DROP TABLE IF EXISTS `mwb_answer`;
CREATE TABLE `mwb_answer` (
    `id`           INT          NOT NULL AUTO_INCREMENT,
    `questionId`   INT          NOT NULL,
    `studentToken` VARCHAR(64)  NOT NULL,
    `answerText`   VARCHAR(500) NOT NULL,
    `submittedAt`  DATETIME     NOT NULL,
    `updatedAt`    DATETIME     NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_question_student` (`questionId`, `studentToken`),
    INDEX `idx_questionId` (`questionId`)
) ENGINE=InnoDB
  CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
