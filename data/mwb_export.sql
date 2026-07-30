/*
 Navicat Premium Dump SQL

 Source Server         : LOCALHOST
 Source Server Type    : MySQL
 Source Server Version : 120302 (12.3.2-MariaDB)
 Source Host           : localhost:3306
 Source Schema         : mwb

 Target Server Type    : MySQL
 Target Server Version : 120302 (12.3.2-MariaDB)
 File Encoding         : 65001

 Date: 10/07/2026 09:11:13
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for mwb_answer
-- ----------------------------
DROP TABLE IF EXISTS `mwb_answer`;
CREATE TABLE `mwb_answer`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `questionId` int NOT NULL,
  `studentToken` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `answerText` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `submittedAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_question_student`(`questionId` ASC, `studentToken` ASC) USING BTREE,
  INDEX `idx_questionId`(`questionId` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of mwb_answer
-- ----------------------------

-- ----------------------------
-- Table structure for mwb_question
-- ----------------------------
DROP TABLE IF EXISTS `mwb_question`;
CREATE TABLE `mwb_question`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `questionCode` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `questionTitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `questionHtml` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacherId` int NOT NULL COMMENT 'mwb_user.id',
  `isActive` tinyint NOT NULL DEFAULT 0 COMMENT '1 = currently accepting answers',
  `launchedAt` datetime NULL DEFAULT NULL,
  `endedAt` datetime NULL DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_questionCode`(`questionCode` ASC) USING BTREE,
  INDEX `idx_teacherId`(`teacherId` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of mwb_question
-- ----------------------------
INSERT INTO `mwb_question` VALUES (3, 'lxwp5f', 'Level 2: Data + [what] = Information', '<p>Data + <em>[what]</em> = Information</p>', 1, 0, '2026-07-10 08:04:37', '2026-07-10 08:05:25', '2026-07-10 08:04:33', '2026-07-10 08:06:06');

-- ----------------------------
-- Table structure for mwb_user
-- ----------------------------
DROP TABLE IF EXISTS `mwb_user`;
CREATE TABLE `mwb_user`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacherName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of mwb_user
-- ----------------------------
INSERT INTO `mwb_user` VALUES (1, 'simonrundell@exe-coll.ac.uk', '81dc9bdb52d04dc20036dbd8313ed055', 'Administrator');

SET FOREIGN_KEY_CHECKS = 1;
