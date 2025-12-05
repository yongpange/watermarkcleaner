# 🚀 快速开始指南

## 5 分钟快速体验文件转换系统

### 步骤 1: 安装依赖 (1 分钟)

```bash
pnpm install
```

### 步骤 2: 启动开发服务器 (30 秒)

```bash
pnpm dev
```

等待看到：
```
✓ Ready in 10.4s
- Local:   http://localhost:3000
```

### 步骤 3: 打开浏览器 (10 秒)

访问：http://localhost:3000/en/convert

### 步骤 4: 上传文件测试 (2 分钟)

#### 方式 1: 使用测试文件

创建一个测试文件 `test.txt`：

```txt
# My Test Document

This is a test document.

## Section 1

Some content here.

## Section 2

- Point 1
- Point 2
- Point 3
```

#### 方式 2: 拖拽现有文件

支持的文件类型：
- ✅ PDF (.pdf)
- ✅ Word (.docx, .doc)
- ✅ 文本 (.txt)
- ✅ Markdown (.md)

### 步骤 5: 查看转换结果 (1 分钟)

1. 文件上传后自动开始转换
2. 观察进度条（0% → 100%）
3. 转换完成后查看结果
4. 点击"Download"下载 Markdown 文件
5. 点击"Advanced Edit"进入编辑器

---

## 🎯 核心功能演示

### 功能 1: 批量转换

1. 同时拖拽多个文件到上传区
2. 系统会并行处理所有文件
3. 每个文件独立显示进度

### 功能 2: 高级编辑

1. 在转换结果中点击"Advanced Edit"
2. 左侧编辑 Markdown
3. 右侧实时预览
4. 点击"Export"导出文件

### 功能 3: 多语言支持

- 英文界面：http://localhost:3000/en/convert
- 中文界面：http://localhost:3000/zh/convert

---

## 🧪 运行测试

验证系统功能：

```bash
npx tsx scripts/test-conversion.ts
```

应该看到所有测试通过：
```
✅ TXT Conversion successful!
✅ Markdown Conversion successful!
✅ Utility functions working!
✅ Language detection working!
🎉 All tests completed!
```

---

## 📱 响应式设计测试

### 桌面端 (推荐)
- 最佳体验
- 完整功能
- 并排编辑和预览

### 平板
- 自适应布局
- 触摸友好

### 移动端
- 垂直布局
- 简化操作

---

## ⚡ 性能基准

| 文件大小 | 预期转换时间 |
|---------|------------|
| < 1 MB  | 2-3 秒     |
| 1-5 MB  | 3-7 秒     |
| 5-10 MB | 7-15 秒    |
| 10-20 MB| 15-30 秒   |

---

## 🐛 常见问题

### Q: 上传失败怎么办？

**A:** 检查：
1. 文件大小是否超过 20MB
2. 文件类型是否支持
3. 浏览器控制台是否有错误

### Q: 转换很慢？

**A:** 可能原因：
1. 文件较大（>10MB）
2. PDF 是扫描版（图片）
3. 网络连接问题

### Q: 结果不准确？

**A:** 注意：
1. PDF 扫描版无法提取文字
2. 复杂格式可能丢失
3. 建议使用原生文本格式

### Q: 数据库错误？

**A:** 系统可以无数据库运行：
1. 使用内存存储
2. 数据保存在 SessionStorage
3. 刷新页面后数据保留

---

## 🎓 下一步

1. **阅读完整文档**: [CONVERSION_SYSTEM.md](./CONVERSION_SYSTEM.md)
2. **查看架构设计**: 文档中的 Mermaid 图表
3. **自定义配置**: 修改 `src/lib/conversion-utils.ts`
4. **添加新功能**: 参考现有代码结构

---

## 💡 提示

- 使用 Chrome/Edge 获得最佳体验
- 开启开发者工具查看详细日志
- 测试时使用小文件（<1MB）
- 转换结果会保存在 SessionStorage

---

## 📞 需要帮助？

1. 查看浏览器控制台错误
2. 检查服务器终端日志
3. 阅读 API 响应错误信息
4. 参考 [CONVERSION_SYSTEM.md](./CONVERSION_SYSTEM.md) 故障排除部分

---

**祝您使用愉快！** 🎉

