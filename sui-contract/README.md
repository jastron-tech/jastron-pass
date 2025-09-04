# Sui Pass

一个基于 Sui Move 的 Pass 管理系统。

## 功能特性

- 创建 Sui Pass
- 转移 Pass 所有权
- 查询 Pass 信息
- 基于 Sui 对象模型的去中心化存储

## 项目结构

```
sui-contract/
├── Move.toml          # 包配置文件
├── sources/           # Move 源代码
│   └── sui_pass.move  # 主要模块
└── README.md          # 项目说明
```

## 使用方法

### 构建项目

```bash
sui move build
```

### 测试项目

```bash
sui move test
```

### 部署到测试网

```bash
sui client publish --gas-budget 10000000
```

## 主要函数

- `create_pass(name, description, image_url, ctx)`: 创建新的 Pass
- `get_pass_info(pass)`: 获取 Pass 信息
- `transfer_pass(pass, recipient)`: 转移 Pass 所有权

## 依赖

- Sui Framework (testnet 版本)
