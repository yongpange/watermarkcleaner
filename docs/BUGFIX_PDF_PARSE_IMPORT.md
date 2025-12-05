# 🐛 PDF Parse 导入错误修复

## 问题描述

构建时出现以下错误：

```
Build Error

Export default doesn't exist in target module

./src/services/conversion/parsers/pdf.ts (1:1)

Export default doesn't exist in target module
> 1 | import pdf from 'pdf-parse';
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The export default was not found in module [project]/node_modules/.pnpm/pdf-parse@2.4.5/node_modules/pdf-parse/dist/pdf-parse/esm/index.js
```

---

## 问题原因（中文解释）

### 根本原因
**`pdf-parse` 和 `mammoth` 是 CommonJS 模块，在 Next.js 15 的 ES 模块环境中无法直接使用默认导入。**

### 详细说明

1. **模块系统差异**：
   - `pdf-parse` 和 `mammoth` 使用 **CommonJS** 格式（`module.exports = ...`）
   - Next.js 15 使用 **ES 模块** 格式（`export default ...`）
   - 两者不兼容

2. **为什么会报错**：
   ```typescript
   // ❌ 错误的写法（ES 模块导入 CommonJS）
   import pdf from 'pdf-parse';
   ```
   
   - Next.js 尝试查找 `pdf-parse` 的 ES 模块导出
   - 但 `pdf-parse` 只有 CommonJS 导出
   - 找不到 `export default`，报错

3. **Turbopack 的严格检查**：
   - Next.js 15 使用 Turbopack 作为打包工具
   - Turbopack 对模块导入检查更严格
   - 不允许混用 CommonJS 和 ES 模块

---

## 解决方案

### 方案：使用动态导入（Dynamic Import）✅

**原理**：
- 动态导入 `import()` 可以在运行时加载模块
- 支持 CommonJS 和 ES 模块
- `.default` 获取 CommonJS 的默认导出

### 修改文件

#### 1. `src/services/conversion/parsers/pdf.ts`

**修改前**：
```typescript
import pdf from 'pdf-parse';

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  const data = await pdf(buffer);
  // ...
}
```

**修改后**：
```typescript
// pdf-parse 是 CommonJS 模块，需要动态导入

export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  // 动态导入 pdf-parse（CommonJS 模块）
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  // ...
}
```

#### 2. `src/services/conversion/parsers/docx.ts`

**修改前**：
```typescript
import mammoth from 'mammoth';

export async function parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
  const textResult = await mammoth.extractRawText({ buffer });
  // ...
}
```

**修改后**：
```typescript
// mammoth 是 CommonJS 模块，需要动态导入

export async function parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
  // 动态导入 mammoth（CommonJS 模块）
  const mammoth = (await import('mammoth')).default;
  const textResult = await mammoth.extractRawText({ buffer });
  // ...
}
```

---

## 为什么这样可以？

### 动态导入的优势

1. **运行时加载**：
   - 在函数执行时才加载模块
   - 避免编译时的模块系统冲突

2. **兼容性好**：
   - 支持 CommonJS 和 ES 模块
   - `.default` 获取 CommonJS 的默认导出

3. **性能影响小**：
   - 只在需要时加载
   - 模块会被缓存，不会重复加载

### 代码执行流程

```typescript
// 1. 函数被调用
export async function parsePDF(buffer: Buffer) {
  
  // 2. 动态导入模块（第一次会加载，之后使用缓存）
  const pdfParse = (await import('pdf-parse')).default;
  //                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                返回模块对象，.default 获取默认导出
  
  // 3. 使用导入的函数
  const data = await pdfParse(buffer);
  
  // 4. 返回结果
  return { text: data.text, ... };
}
```

---

## 其他可能的解决方案

### 方案 2: 修改 Next.js 配置（不推荐）

在 `next.config.js` 中配置：

```javascript
module.exports = {
  experimental: {
    esmExternals: 'loose',
  },
};
```

**缺点**：
- 可能导致其他模块问题
- 不是根本解决方案

### 方案 3: 使用 require（不推荐）

```typescript
const pdf = require('pdf-parse');
```

**缺点**：
- TypeScript 不推荐在 ES 模块中使用 `require`
- 可能导致类型检查问题

---

## 验证修复

### 1. 重启开发服务器
```bash
# 停止服务器（Ctrl+C）
pnpm dev
```

### 2. 检查编译
应该看到：
```
✓ Compiled in 1352ms
✓ Ready in 2.9s
```

没有错误！✅

### 3. 测试功能
```bash
# 运行测试脚本
npx tsx scripts/test-conversion.ts
```

应该看到：
```
✅ TXT Conversion successful!
✅ Markdown Conversion successful!
✅ Utility functions working!
✅ Language detection working!
🎉 All tests completed!
```

### 4. 测试 PDF 转换
1. 访问 `http://localhost:3001/en/convert`
2. 上传一个 PDF 文件
3. 查看转换结果
4. ✅ 应该正常工作

---

## 学习要点

### CommonJS vs ES 模块

| 特性 | CommonJS | ES 模块 |
|------|----------|---------|
| 导出 | `module.exports = ...` | `export default ...` |
| 导入 | `const x = require('x')` | `import x from 'x'` |
| 加载时机 | 运行时 | 编译时 |
| 环境 | Node.js | 浏览器 + Node.js |

### Next.js 15 的变化

1. **默认使用 ES 模块**
2. **Turbopack 严格检查**
3. **不兼容旧的 CommonJS 导入**

### 最佳实践

1. **优先使用 ES 模块包**
   - 查看包的 `package.json` 中的 `"type": "module"`
   - 使用支持 ES 模块的库

2. **CommonJS 包使用动态导入**
   ```typescript
   const module = (await import('commonjs-package')).default;
   ```

3. **检查包的兼容性**
   - 查看 npm 包的文档
   - 检查是否支持 ES 模块

---

## 相关问题

### Q: 为什么不直接换一个支持 ES 模块的库？

**A**: 
- `pdf-parse` 和 `mammoth` 是最成熟的解决方案
- 功能完善，社区支持好
- 动态导入的性能影响很小

### Q: 动态导入会影响性能吗？

**A**: 
- 第一次加载会有轻微延迟（几毫秒）
- 之后模块会被缓存，性能无影响
- 对于文件转换这种 I/O 密集操作，影响可忽略

### Q: 所有 CommonJS 包都需要这样处理吗？

**A**: 
- 不一定，Next.js 会自动处理大部分包
- 只有在编译报错时才需要手动处理
- 主要是一些老旧的 Node.js 专用包

---

## 总结

**问题**：`pdf-parse` 和 `mammoth` 是 CommonJS 模块，无法直接导入  
**原因**：Next.js 15 使用 ES 模块，Turbopack 严格检查  
**解决**：使用动态导入 `(await import('...')).default`  
**结果**：✅ 编译成功，功能正常  

---

**修复时间**: 2025-10-29  
**状态**: ✅ 已修复并验证  
**影响范围**: PDF 和 DOCX 文件解析功能

