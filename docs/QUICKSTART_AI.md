# 🚀 AI 增强功能快速启动指南

## 5 分钟快速配置

### 步骤 1: 获取 DeepSeek API Key

1. 访问 **DeepSeek 平台**: https://platform.deepseek.com
2. 注册账号（支持邮箱注册）
3. 进入 **API Keys** 页面
4. 点击 **Create API Key**
5. 复制生成的 API Key（格式：`sk-xxxxxxxxxxxxxxxx`）

**注意**: 
- 新用户通常有免费额度
- API Key 只显示一次，请妥善保存

---

### 步骤 2: 配置环境变量

#### 方法 1: 使用 .env.local（推荐）

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑 .env.local，添加以下内容
DEEPSEEK_API_KEY="sk-your-actual-api-key-here"
```

#### 方法 2: 直接创建 .env.local

创建文件 `.env.local`，内容如下：

```bash
# DeepSeek API Key
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxx"
```

**重要**: 
- 不要提交 `.env.local` 到 Git
- 已在 `.gitignore` 中排除

---

### 步骤 3: 启动开发服务器

```bash
# 安装依赖（如果还没安装）
pnpm install

# 启动开发服务器
pnpm dev
```

应该看到：
```
✓ Ready in 3.3s
Local: http://localhost:3001
```

---

### 步骤 4: 测试 AI 功能

#### 4.1 上传文件
1. 访问 http://localhost:3001/en/convert
2. 上传一个 Word 文件（建议包含学习内容）
3. 等待转换完成

#### 4.2 进入 Workspace
1. 点击 **"Advanced Edit"** 按钮
2. 跳转到 `/workspace` 页面

#### 4.3 查看 AI 生成
1. 页面加载后，右侧自动显示 "AI 正在生成学习笔记..."
2. 观察打字机效果（实时显示生成内容）
3. 等待生成完成（通常 5-15 秒）

#### 4.4 测试功能
- ✅ 点击 **"AI 笔记"** 按钮 → 切换到 **"原始预览"**
- ✅ 点击 **"原始预览"** 按钮 → 切换回 **"AI 笔记"**
- ✅ 点击 **"重新生成"** 按钮 → AI 重新总结

---

## 功能演示

### 示例输入（Word 文件内容）

```
JavaScript 基础知识

1. 变量声明
- var: 函数作用域
- let: 块级作用域
- const: 常量

2. 数据类型
- 基本类型: string, number, boolean, null, undefined
- 引用类型: object, array, function

3. 函数
- 函数声明
- 箭头函数
- 回调函数
```

### 示例输出（AI 生成的学习笔记）

```markdown
# JavaScript 基础知识学习笔记

## 一、变量声明（重点）

### 1. var（旧语法）
- **作用域**: 函数作用域
- **特点**: 可重复声明，存在变量提升
- **考点**: 理解作用域差异

### 2. let（推荐）
- **作用域**: 块级作用域 {}
- **特点**: 不可重复声明，无变量提升
- **考点**: 与 var 的区别

### 3. const（常量）
- **作用域**: 块级作用域
- **特点**: 声明后不可修改（引用类型除外）
- **考点**: 常量的使用场景

## 二、数据类型（必考）

### 基本类型（5 种）
1. string - 字符串
2. number - 数字
3. boolean - 布尔值
4. null - 空值
5. undefined - 未定义

### 引用类型（3 种）
1. object - 对象
2. array - 数组
3. function - 函数

**考点**: 基本类型 vs 引用类型的区别

## 三、函数（核心）

### 1. 函数声明
```javascript
function name() { }
```

### 2. 箭头函数（ES6）
```javascript
const name = () => { }
```

### 3. 回调函数
- 作为参数传递的函数
- 异步编程的基础

**考点**: 三种函数的区别和使用场景

---

## 复习要点
1. 掌握 var/let/const 的区别
2. 理解基本类型和引用类型
3. 熟练使用三种函数声明方式
```

---

## 界面说明

### Workspace 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  Toolbar                                                │
│  [返回] [AI 笔记] [隐藏预览] [保存] [导出] [分享]        │
├──────────────┬──────────────────────────────────────────┤
│              │  左侧：编辑器          │  右侧：AI 预览    │
│   Sidebar    │  ┌──────────────┐    │  ┌─────────────┐ │
│              │  │ # JavaScript │    │  │ AI 学习笔记  │ │
│  文档信息    │  │              │    │  │             │ │
│  - 文件名    │  │ 1. 变量声明  │    │  │ ## 一、变量  │ │
│  - 大小      │  │ - var        │    │  │ ### 1. var  │ │
│  - 类型      │  │ - let        │    │  │ - 作用域... │ │
│  - 创建时间  │  │ - const      │    │  │             │ │
│              │  │              │    │  │ [重新生成]   │ │
│              │  └──────────────┘    │  └─────────────┘ │
└──────────────┴──────────────────────┴──────────────────┘
```

### 按钮说明

| 按钮 | 功能 | 图标 |
|------|------|------|
| **AI 笔记** | 显示 AI 生成的学习笔记 | ✨ Sparkles |
| **原始预览** | 显示原始 Markdown 预览 | 📄 FileCode |
| **重新生成** | 重新调用 AI 生成笔记 | 🔄 RefreshCw |
| **隐藏预览** | 隐藏右侧预览区域 | 👁️ EyeOff |
| **保存** | 保存编辑内容 | 💾 Save |
| **导出** | 导出为 MD/PDF/DOCX | ⬇️ Download |

---

## 故障排查

### 问题 1: AI 生成失败

**症状**: 右侧显示 "生成失败" 错误

**解决方法**:
1. 检查 `.env.local` 是否存在
2. 检查 `DEEPSEEK_API_KEY` 是否正确
3. 重启开发服务器：
   ```bash
   # Ctrl+C 停止服务器
   pnpm dev
   ```
4. 查看浏览器控制台错误信息

---

### 问题 2: API Key 未配置

**症状**: 错误信息 "DeepSeek API key not configured"

**解决方法**:
1. 确认 `.env.local` 文件存在
2. 确认文件中有 `DEEPSEEK_API_KEY="sk-xxx"`
3. 确认没有多余的空格或引号
4. 重启服务器

---

### 问题 3: 生成速度慢

**症状**: AI 生成需要很长时间

**原因**: 
- 文档内容过长（> 5000 字）
- 网络延迟
- DeepSeek API 负载高

**解决方法**:
- 等待完成（通常不超过 30 秒）
- 如果超时，点击 "重新生成"

---

### 问题 4: 打字机效果不流畅

**症状**: 内容一次性显示，没有逐字效果

**原因**: 
- 网络速度太快
- 内容太短

**说明**: 
- 这是正常现象
- 流式输出依赖网络速度
- 不影响功能使用

---

## 高级配置

### 自定义提示词

编辑 `src/app/api/ai/summarize/route.ts`:

```typescript
const prompt = `${content}

你的自定义提示词，例如：
- 总结为思维导图格式
- 提取关键知识点
- 生成复习题目
`;
```

### 调整 AI 参数

```typescript
{
  model: 'deepseek-chat',
  temperature: 0.7,  // 0-1，越高越创造性
  max_tokens: 4000,  // 最大生成长度
}
```

### 更换 AI 模型

支持任何兼容 OpenAI API 的模型：

```typescript
// GPT-4
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4',
    // ...
  }),
});
```

---

## 成本估算

### DeepSeek 定价（参考）

- **输入**: ¥0.001 / 1K tokens
- **输出**: ¥0.002 / 1K tokens

### 示例成本

| 文档大小 | 输入 Tokens | 输出 Tokens | 成本 |
|---------|------------|------------|------|
| 1000 字 | ~1500 | ~2000 | ¥0.006 |
| 5000 字 | ~7500 | ~3000 | ¥0.014 |
| 10000 字 | ~15000 | ~4000 | ¥0.023 |

**说明**: 
- 1 个汉字 ≈ 1.5 tokens
- 实际成本可能有波动
- 新用户通常有免费额度

---

## 总结

### ✅ 完成的功能
- DeepSeek AI 集成
- 自动生成学习笔记
- 流式输出（打字机效果）
- AI/原始预览切换
- 重新生成功能
- 完善的错误处理

### 📚 相关文档
- **详细实现**: `AI_ENHANCEMENT_GUIDE.md`
- **系统架构**: `CONVERSION_SYSTEM.md`
- **测试指南**: `TEST_GUIDE.md`

### 🎯 下一步
1. 配置 DeepSeek API Key
2. 测试 AI 生成功能
3. 根据需求自定义提示词
4. 部署到生产环境

---

**配置时间**: < 5 分钟  
**状态**: ✅ 即刻可用  
**支持**: 查看文档或提交 Issue

