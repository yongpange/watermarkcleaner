#!/bin/bash

# Git 提交助手函数
# 使用方法: source .claude/git-commit-helper.sh
# 然后运行: gcommit "你的提交信息"

gcommit() {
    local message="$1"

    if [ -z "$message" ]; then
        echo "❌ 请提供提交信息"
        echo "用法: gcommit \"提交信息\""
        return 1
    fi

    echo "📊 检查更改..."
    git status --short

    echo ""
    echo "📝 添加更改..."
    git add -A

    echo ""
    echo "🔍 查看将要提交的文件..."
    git diff --cached --stat

    echo ""
    echo "💾 创建提交: $message"
    git commit -m "$message"

    echo ""
    echo "✅ 提交完成！"
    echo "🚀 运行 'git push' 来推送更改"
}

# 快速提交函数 - 自动生成提交信息
gcommit-auto() {
    echo "🤖 自动生成提交信息..."

    # 获取更改的文件列表
    local files=$(git diff --cached --name-only 2>/dev/null || git diff --name-only)

    if [ -z "$files" ]; then
        echo "❌ 没有检测到更改"
        return 1
    fi

    # 简单的提交信息生成逻辑
    local message=""
    local file_count=$(echo "$files" | wc -l)

    if [ "$file_count" -eq 1 ]; then
        local filename=$(basename "$files")
        if [[ "$filename" == *.md ]]; then
            message="docs: 更新 $filename"
        elif [[ "$filename" == *.js ]] || [[ "$filename" == *.ts ]] || [[ "$filename" == *.tsx ]]; then
            message="feat: 更新 $filename"
        elif [[ "$filename" == *.css ]] || [[ "$filename" == *.scss ]]; then
            message="style: 更新样式文件"
        else
            message="chore: 更新 $filename"
        fi
    else
        message="chore: 更新 $file_count 个文件"
    fi

    echo "📝 建议提交信息: $message"
    read -p "确认使用此信息？(y/N): " confirm

    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        gcommit "$message"
    else
        echo "❌ 取消提交"
    fi
}

echo "🎯 Git 提交助手已加载！"
echo "可用命令:"
echo "  gcommit \"提交信息\"  - 手动输入提交信息"
echo "  gcommit-auto        - 自动生成提交信息"