# 文件上传问题调试指南

## 问题描述
上传文件时出现 "File is empty" 错误（400 状态码）

## 已添加的调试功能

### 1. 前端验证增强
- 在 `src/lib/conversion-utils.ts` 中添加了空文件检查
- 在文件上传前验证文件是否存在且大小 > 0

### 2. 详细日志
已在以下位置添加 console.log：

#### 前端 (`src/app/[locale]/convert/client.tsx`)
- 文件详细信息（名称、大小、类型、最后修改时间）
- FormData 内容验证

#### 前端 (`src/components/convert/DropZone.tsx`)
- 文件处理流程
- 文件验证结果

#### 后端 (`src/app/api/convert/upload/route.ts`)
- 接收到的文件信息
- 验证失败的详细原因

## 调试步骤

### 1. 打开浏览器开发者工具
- 按 F12 或右键 -> 检查
- 切换到 "Console" 标签

### 2. 尝试上传文件
观察控制台输出，查找以下信息：

```
Processing files: 1
Validating file: { name: "...", size: ..., type: "..." }
File is valid: ...
Passing valid files to parent: 1
File details: { name: "...", size: ..., type: "...", lastModified: ... }
FormData file: File { ... }
```

### 3. 检查网络请求
- 切换到 "Network" 标签
- 找到 `/api/convert/upload` 请求
- 查看 Request Payload 中的文件信息

## 可能的原因和解决方案

### 原因 1: 文件本身为空
**症状**: 文件大小显示为 0
**解决方案**: 
- 确认选择的文件不是空文件
- 尝试用文本编辑器打开文件，确认有内容
- 重新创建或下载文件

### 原因 2: 浏览器兼容性问题
**症状**: FormData 中的文件对象异常
**解决方案**:
- 尝试使用不同的浏览器（Chrome、Firefox、Edge）
- 清除浏览器缓存
- 禁用浏览器扩展

### 原因 3: 文件路径或权限问题
**症状**: 文件选择后无法读取
**解决方案**:
- 将文件复制到桌面或其他位置再试
- 确认文件没有被其他程序占用
- 检查文件权限

### 原因 4: 网络传输问题
**症状**: 文件在传输过程中丢失
**解决方案**:
- 检查网络连接
- 尝试较小的文件
- 查看服务器日志

## 支持的文件格式
- PDF (.pdf)
- Word 文档 (.docx, .doc)
- 文本文件 (.txt)
- Markdown (.md)

## 文件大小限制
- 最大: 20MB
- 最小: 必须 > 0 字节

## 如何获取更多帮助

1. **收集信息**:
   - 浏览器控制台的完整日志
   - Network 标签中的请求详情
   - 文件的详细信息（大小、类型、来源）

2. **提供截图**:
   - Console 标签的输出
   - Network 标签的请求详情
   - 错误提示

3. **测试文件**:
   尝试创建一个简单的测试文件：
   ```bash
   # 创建一个简单的文本文件
   echo "This is a test file" > test.txt
   ```
   然后尝试上传这个文件

## 临时解决方案

如果问题持续存在，可以尝试：

1. **使用不同的文件**
   - 尝试上传不同格式的文件
   - 尝试上传较小的文件

2. **检查文件内容**
   ```bash
   # Windows (PowerShell)
   Get-Content your-file.txt
   
   # 或者用记事本打开
   notepad your-file.txt
   ```

3. **重新生成文件**
   - 如果是导出的文件，重新导出
   - 如果是下载的文件，重新下载

## 下一步

运行应用并尝试上传文件，然后查看控制台输出。根据日志信息，我们可以进一步诊断问题。

