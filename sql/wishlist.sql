/*
 种草清单模块数据库表设计
 对应功能：记录美食、店铺、旅行、好物等各类种草信息
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for wishlist_items
-- ----------------------------
DROP TABLE IF EXISTS `wishlist_items`;
CREATE TABLE `wishlist_items` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) UNSIGNED NOT NULL COMMENT '所属用户ID',
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '种草名称',
  `type` enum('food','shop','travel','goods','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '种草类型: food-美食, shop-店铺, travel-旅行, goods-好物, other-其他',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '种草位置 (美食/店铺/旅行类型推荐填写)',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注信息',
  `is_completed` tinyint(1) NOT NULL DEFAULT 0 COMMENT '状态: 0-未拔草(待体验), 1-已拔草(已完成)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_wishlist_user_id`(`user_id`) USING BTREE,
  INDEX `idx_wishlist_type`(`type`) USING BTREE,
  CONSTRAINT `fk_wishlist_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '种草清单表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
