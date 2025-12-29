#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// 获取git更改
function getGitChanges() {
  try {
    // 获取更改的文件
    const changedFiles = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();

    // 获取详细的更改内容
    const diff = execSync('git diff --stat', { encoding: 'utf8' }).trim();
    const stagedDiff = execSync('git diff --cached --stat', { encoding: 'utf8' }).trim();

    return {
      changed: changedFiles,
      staged: stagedFiles,
      diff: diff,
      stagedDiff: stagedDiff
    };
  } catch (error) {
    console.error('获取git更改失败:', error.message);
    return null;
  }
}

// 生成提交信息
function generateCommitMessage(changes) {
  if (!changes || (!changes.changed && !changes.staged)) {
    return null;
  }

  const files = changes.staged || changes.changed;
  const fileList = files.split('\n').filter(f => f.trim());

  // 分析文件类型
  const types = {
    docs: 0,
    feat: 0,
    fix: 0,
    style: 0,
    refactor: 0,
    test: 0,
    chore: 0
  };

  fileList.forEach(file => {
    if (file.endsWith('.md') || file.endsWith('.txt')) {
      types.docs++;
    } else if (file.endsWith('.test.js') || file.endsWith('.spec.js') || file.includes('test')) {
      types.test++;
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (file.includes('fix') || file.includes('bug')) {
        types.fix++;
      } else {
        types.feat++;
      }
    } else if (file.endsWith('.css') || file.endsWith('.scss') || file.endsWith('.less')) {
      types.style++;
    } else {
      types.chore++;
    }
  });

  // 确定主要类型
  let mainType = 'chore';
  let maxCount = 0;
  Object.entries(types).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mainType = type;
    }
  });

  // 生成描述
  let description = '';
  if (fileList.length === 1) {
    description = `更新 ${fileList[0]}`;
  } else {
    const mainFiles = fileList.slice(0, 3).map(f => f.split('/').pop()).join(', ');
    description = `更新 ${fileList.length} 个文件 (${mainFiles})`;
  }

  return `${mainType}: ${description}`;
}

// 执行提交
function performCommit(message) {
  try {
    console.log('📝 添加更改...');
    execSync('git add -A', { stdio: 'inherit' });

    console.log('💾 创建提交...');
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });

    console.log('✅ 提交完成！');
    console.log('🚀 运行 "git push" 来推送更改');
  } catch (error) {
    console.error('❌ 提交失败:', error.message);
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('🤖 AI Git 提交助手\n');

  const changes = getGitChanges();
  if (!changes) {
    console.log('❌ 无法获取更改信息');
    return;
  }

  if (!changes.changed && !changes.staged) {
    console.log('ℹ️  没有检测到更改');
    return;
  }

  console.log('📊 检测到以下更改:');
  if (changes.staged) {
    console.log('已暂存的文件:');
    changes.staged.split('\n').forEach(file => console.log(`  ✓ ${file}`));
  }
  if (changes.changed) {
    console.log('未暂存的文件:');
    changes.changed.split('\n').forEach(file => console.log(`  - ${file}`));
  }

  const suggestedMessage = generateCommitMessage(changes);
  if (!suggestedMessage) {
    console.log('❌ 无法生成提交信息');
    return;
  }

  console.log(`\n💡 建议的提交信息: ${suggestedMessage}`);

  // 如果有命令行参数，直接使用
  if (process.argv[2]) {
    const customMessage = process.argv.slice(2).join(' ');
    console.log(`\n📝 使用自定义信息: ${customMessage}`);
    performCommit(customMessage);
  } else {
    // 询问是否使用建议的信息
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n使用建议的提交信息？(y/N/自定义): ', (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'y' || answer === '') {
        performCommit(suggestedMessage);
      } else if (answer.toLowerCase() === 'n') {
        console.log('❌ 取消提交');
      } else {
        performCommit(answer);
      }
    });
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { getGitChanges, generateCommitMessage };