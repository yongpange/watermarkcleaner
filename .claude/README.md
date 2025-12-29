# Claude Git 助手工具

这个目录包含了 Git 提交助手工具，帮助你更轻松地创建规范的 Git 提交。

## 使用方法

### 方法 1: Bash 函数（简单快捷）

```bash
# 加载函数
source .claude/git-commit-helper.sh

# 手动输入提交信息
gcommit "你的提交信息"

# 自动生成提交信息
gcommit-auto
```

### 方法 2: AI 智能提交（推荐）

```bash
# 进入 .claude 目录
cd .claude

# 运行 AI 提交助手
node ai-commit.js

# 或者直接带参数运行（跳过交互）
node ai-commit.js "自定义提交信息"
```

### 方法 3: 通过 npm 脚本

```bash
# 在 .claude 目录下
cd .claude
npm run commit
```

## 功能特点

1. **自动检测更改**: 智能分析你修改的文件
2. **生成合适信息**: 根据文件类型和内容自动生成提交信息
3. **交互式确认**: 可以选择使用建议的信息或自定义
4. **安全提交**: 只提交，不推送，让你自己控制推送时机

## 提交信息格式

工具会根据文件类型自动生成符合规范的提交信息：

- `docs: 更新文档` - 对于 .md, .txt 文件
- `feat: 更新功能` - 对于 .js, .ts, .tsx 文件
- `fix: 修复问题` - 对于修复相关的文件
- `style: 更新样式` - 对于 .css, .scss 文件
- `test: 更新测试` - 对于测试文件
- `chore: 更新杂项` - 其他文件

## 快捷方式

你可以在你的 shell 配置文件（如 ~/.bashrc 或 ~/.zshrc）中添加：

```bash
# Git 提交助手
alias gcommit='node /e/1_CODE/watermarkcleaner_com/.claude/ai-commit.js'
```

然后就可以在任何地方使用 `gcommit` 命令了！

## 注意事项

- 工具只会创建提交，不会自动推送
- 你可以随时用 `git push` 手动推送
- 如果对自动生成的信息不满意，可以自定义输入