# Family Tools (家庭工具箱)

[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)

一个基于现代 Web 技术栈构建的移动端优先家庭管理应用。旨在为家庭成员提供便捷的信息共享、生活管理和工具服务。采用 Apple 风格的极简设计，体验流畅。

## 📸 项目截图

> 请将截图文件放入 `docs/images/` 目录，并替换下方的文件名。

| 首页预览 | 工具箱预览 | 我的页面预览 |
| :---: | :---: | :---: |
| <img src="docs/images/ep1.jpg" alt="首页" width="300" /> | <img src="docs/images/ep2.jpg" alt="工具箱" width="300" /> | <img src="docs/images/ep3.jpg" alt="我的页面" width="300" /> |

*(注：以上为示例占位符，请上传实际图片后显示)*

## ✨ 主要功能

- **👤 用户与权限系统**
  - 安全的登录、注册与密码找回。
  - 基于角色的访问控制 (RBAC)，区分管理员与普通家庭成员。

- **👨‍👩‍👧‍👦 家庭管理**
  - 家庭成员档案管理。
  - 成员关系维护。

- **🍽️ 家庭点餐系统**
  - 完整的菜单浏览与分类管理。
  - 购物车与下单流程。
  - 订单历史与详情查看。

- **🔐 密码管家**
  - 安全存储家庭各类账号密码。
  - 支持密码分类与快速检索。
  - 敏感信息加密存储。

- **📅 日程管理**
  - 集成农历支持的日历视图。
  - 家庭公共日程与提醒。

- **📱 移动端体验**
  - 基于 Vant UI 的响应式设计。
  - 适配各种移动设备屏幕。
  - 类似原生应用的流畅交互。

## 🛠️ 技术栈

### 前端 (Frontend)
- **核心框架**: Vue 3, TypeScript, Vite
- **UI 组件库**: Vant 4 (Mobile UI)
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP 客户端**: Axios
- **工具库**: Day.js, Lunar-javascript (农历)

### 后端 (Backend)
- **运行环境**: Node.js
- **Web 框架**: Express
- **语言**: TypeScript
- **数据库**: MySQL (业务数据), Redis (缓存与会话)
- **认证安全**: JWT, Bcrypt, Zod (验证)
- **文件上传**: Multer

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- MySQL >= 5.7
- Redis

### 1. 克隆项目
```bash
git clone <repository-url>
cd fm_tools
```

### 2. 后端设置

安装依赖：
```bash
npm install
```

配置环境变量：
复制 `.env.example` 为 `.env` 并修改数据库配置。
```bash
cp .env.example .env
```

初始化数据库：
请在 MySQL 中创建数据库 `fm_tools`，并按顺序执行 `sql/` 目录下的 SQL 脚本，或者直接导入完整的结构文件。

启动后端开发服务器：
```bash
npm run dev
```
后端服务默认运行在 `http://localhost:3000`。

### 3. 前端设置

进入前端目录并安装依赖：
```bash
cd frontend
npm install
```

配置环境变量：
复制 `.env.example` 为 `.env`。
```bash
cp .env.example .env
```

启动前端开发服务器：
```bash
npm run dev
```
前端页面默认运行在 `http://localhost:5173`。

## 📂 目录结构

```
fm_tools/
├── dist/               # 后端编译输出
├── docs/               # 项目文档
├── frontend/           # 前端项目目录
│   ├── src/
│   │   ├── api/        # API 接口定义
│   │   ├── app/        # 核心应用逻辑 (Store, Router)
│   │   ├── components/ # 通用组件
│   │   ├── pages/      # 页面组件
│   │   └── styles/     # 全局样式
│   └── vite.config.ts
├── sql/                # 数据库 SQL 脚本
├── src/                # 后端源代码
│   ├── config/         # 配置文件
│   ├── controllers/    # 业务逻辑控制器
│   ├── db/             # 数据库连接
│   ├── middleware/     # 中间件 (Auth, Upload)
│   ├── routes/         # API 路由
│   └── utils/          # 工具函数
├── .env                # 后端环境变量
├── package.json        # 后端依赖配置
└── tsconfig.json       # TypeScript 配置
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 📄 许可证

[MIT License](LICENSE)
