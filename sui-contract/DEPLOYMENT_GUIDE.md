# Jastron Pass - Enhanced Deployment Guide

## 🚀 概述

这个增强的 Makefile 提供了强大的部署和升级功能，包括自动解析部署结果、提取对象 ID 和管理部署文件。

## 📋 主要功能

### 1. 基础部署命令
```bash
# 基础部署（无解析）
make deploy-testnet
make deploy-devnet
make deploy-mainnet

# 增强部署（带解析）
make deploy-testnet-parse
make deploy-devnet-parse
make deploy-mainnet-parse
```

### 2. 升级命令
```bash
# 基础升级
make upgrade-testnet PACKAGE_ID=0x...
make upgrade-devnet PACKAGE_ID=0x...
make upgrade-mainnet PACKAGE_ID=0x...

# 增强升级（带解析）
make upgrade-testnet-parse PACKAGE_ID=0x...
make upgrade-devnet-parse PACKAGE_ID=0x...
make upgrade-mainnet-parse PACKAGE_ID=0x...
```

### 3. 对象提取功能
```bash
# 提取所有重要对象
make extract-all-objects FILE=deployment/testnet/20250914-v6.txt

# 提取所有对象 ID
make extract-object-ids FILE=deployment/testnet/20250914-v6.txt

# 提取特定类型对象
make extract-specific-objects FILE=deployment/testnet/20250914-v6.txt TYPE=UpgradeCap
```

### 4. 部署管理
```bash
# 列出所有部署文件
make list-deployments

# 显示最新部署文件
make latest-deployment

# 解析最新部署
make parse-latest NETWORK=testnet

# 获取最新部署的 Package ID
make get-package-id NETWORK=testnet
```

## 🔧 技术特性

### 自动文件管理
- 自动创建部署目录
- 按日期和版本号命名文件
- 支持 JSON 和人类可读格式

### 智能解析
- 自动检测文件格式（JSON vs 人类可读）
- 提取 Package ID、对象 ID 和交易详情
- 支持多种对象类型识别

### 错误处理
- 参数验证
- 文件存在性检查
- 优雅的错误消息

## 📊 支持的对象类型

- **Package ID**: 智能合约包 ID
- **UpgradeCap**: 升级权限对象
- **AdminCap**: 管理员权限对象
- **TransferPolicy**: 转移政策对象
- **TransferPolicyCap**: 转移政策权限对象
- **Platform**: 平台对象
- **OrganizerCap**: 主办方权限对象
- **UserCap**: 用户权限对象

## 💡 使用示例

### 完整部署流程
```bash
# 1. 构建和测试
make build test

# 2. 部署到测试网并解析结果
make deploy-testnet-parse

# 3. 查看部署结果
make latest-deployment

# 4. 提取所有对象
make extract-all-objects FILE=deployment/testnet/20250914-v6.txt
```

### 升级流程
```bash
# 1. 获取当前 Package ID
make get-package-id NETWORK=testnet

# 2. 升级并解析结果
make upgrade-testnet-parse PACKAGE_ID=0x281f8503d34b52616e5e8077ff2a44f244772b467dbe1ebfec6cbef19ff63b72

# 3. 验证升级结果
make parse-latest NETWORK=testnet
```

### 对象查找
```bash
# 查找特定类型的对象
make find-object-by-type TYPE=UpgradeCap NETWORK=testnet

# 提取特定对象
make extract-specific-objects FILE=deployment/testnet/20250914-v6.txt TYPE=TransferPolicy
```

## 🛠️ 高级功能

### 部署文件清理
```bash
# 清理旧部署文件（保留最近5个）
make clean-deployments
```

### 升级权限管理
```bash
# 列出所有升级权限
make list-upgrade-caps

# 获取特定包的升级权限
make get-upgrade-cap PACKAGE_ID=0x...

# 检查升级资格
make check-upgrade-eligibility PACKAGE_ID=0x...
```

## 📁 文件结构

```
deployment/
├── devnet/
│   ├── 20250913-v1.txt
│   └── 20250913-v2.txt
├── testnet/
│   ├── 20250909-v1.txt
│   ├── 20250913-v2.txt
│   └── ...
└── mainnet/
    └── (empty)
```

## 🔍 故障排除

### 常见问题

1. **找不到 Package ID**
   - 检查文件格式是否正确
   - 确认部署是否成功

2. **解析失败**
   - 检查文件是否存在
   - 验证文件格式

3. **权限错误**
   - 确认有正确的 UpgradeCap
   - 检查钱包权限

### 调试命令
```bash
# 查看帮助
make help-deploy

# 检查当前环境
make env

# 查看活跃地址
make active-address

# 查看余额
make balance
```

## 🎯 最佳实践

1. **部署前检查**
   ```bash
   make build test
   make env
   make balance
   ```

2. **使用解析功能**
   ```bash
   # 总是使用带解析的部署命令
   make deploy-testnet-parse
   ```

3. **保存重要信息**
   ```bash
   # 提取并保存所有对象 ID
   make extract-all-objects FILE=deployment/testnet/latest.txt > objects.txt
   ```

4. **定期清理**
   ```bash
   # 定期清理旧部署文件
   make clean-deployments
   ```

## 📞 支持

如果遇到问题，请：
1. 查看帮助：`make help-deploy`
2. 检查日志文件
3. 验证网络连接
4. 确认钱包权限

---

**注意**: 这个增强的 Makefile 支持 JSON 和人类可读格式的部署文件，并提供了强大的对象提取和管理功能。
