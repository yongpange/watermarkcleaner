# 最终步骤：修复后重启服务器

## ✅ 已应用的修复

### 关键修改：`CreditsDisplay.tsx`

**问题**：`useSession()` 卡在 `loading` 状态，永远不会变为 `unauthenticated`，导致 API 调用被跳过。

**解决方案**：
```typescript
useEffect(() => {
  // CRITICAL FIX: Also call API when status is loading but credits is null
  if (status === "unauthenticated" || (status === "loading" && credits === null)) {
    fetchCredits(); // Call API even when loading
  }
}, [session, status, credits]); // Add credits to dependencies
```

现在会：
- ✅ 当 `status === "unauthenticated"` 时调用 API
- ✅ 当 `status === "loading"` 且 `credits === null` 时也调用 API
- ✅ 将 `credits` 添加到依赖数组，确保状态更新时重新渲染

---

## 🚀 立即操作

### 步骤 1：停止当前服务器

在运行 `npm run dev` 的终端：
```bash
# 按 Ctrl+C
# 等待进程完全停止
```

### 步骤 2：重启服务器

```bash
cd e:/1_CODE/watermarkcleaner_com

# 清除终端
Cmd+K  # Mac
clear  # Linux/Mac
cls    # Windows

# 重启
npm run dev
```

### 步骤 3：清除浏览器数据

按 **F12** 打开开发者工具，在 **Console** 标签页运行：

```javascript
// 清除所有存储数据
localStorage.clear();
sessionStorage.clear();

// 清除 cookies
document.cookie.split(";").forEach(cookie => {
  const parts = cookie.split("=");
  document.cookie = parts[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

// 清除控制台并强制刷新
console.clear();
location.reload(true);
```

### 步骤 4：访问页面并查看日志

访问：**http://127.0.0.1:3000/convert**

在 **浏览器控制台（F12 Console）** 现在应该看到：

```javascript
[CreditsDisplay] ===== COMPONENT RENDERED =====
[CreditsDisplay] Status: loading
[CreditsDisplay] Session exists: false
[CreditsDisplay] Credits state: null
[CreditsDisplay] Loading state: false

[CreditsDisplay] :::: useEffect TRIGGERED ::::
[CreditsDisplay] Dependencies - Status: loading
[CreditsDisplay] Dependencies - Session: false
[CreditsDisplay] >>>>> Starting fetchCredits <<<<<
[CreditsDisplay] Mode: LOADING but credits is null (calling API anyway)  ← 关键修复！
[CreditsDisplay] Calling /api/credits/check-ip...

[CreditsDisplay] Response status: 200  ← 调用成功！
[CreditsDisplay] SUCCESS - Got data: {tier: 'unverified', used: 0, limit: 3, remaining: 3}
[CreditsDisplay] >>>>> fetchCredits COMPLETED <<<<<<

[CreditsDisplay] Render check - Final states: {loading: false, credits: true, error: false}
```

同时在**终端窗口**也应该看到：

```
[Credits API] ===== Credit Check Started =====
[Credits API] Raw IP: "127.0.0.1"
[Credits API] IP Hash Salt: "1f8b83c74037ae6b2d473c1f2ffd4d070a0f335431c938216a71fec88e68dcd3"
[Credits API] Hashed IP: "a826ce17df04bd6d233c1acd1cfdd5ec92a8335d8dc0b6745f3011852d97798c"
[Credits Check] ===== IP-based User Check Started =====
[Credits Check] Original IP: 127.0.0.1
[Credits Check] Hashed IP: a826ce17df04bd6d233c1acd1cfdd5ec92a8335d8dc0b6745f3011852d97798c
[Credits Check] Query period: 2025-12-31T16:00:00.000Z to 2026-01-04T15:30:00.000Z
[Credits Check] Executing Supabase query...
[Credits Check] Conditions:
  - ip_address: a826ce17df04bd6d233c1acd1cfdd5ec92a8335d8dc0b6745f3011852d97798c
  - created_at >= 2025-12-31T16:00:00.000Z
  - success: true
[Credits Check] Query result count: X  ← 这个数字很关键！
[Credits API] Final result: { tier: "unverified", used: X, limit: 3, remaining: Y }
[Credits API] ===== Credit Check Completed =====
```

### 步骤 5：处理图片并验证更新

上传并处理一张图片，然后刷新页面（或检查 Dropdown 中的额度显示）。

**期望结果：**
```
处理前：Monthly usage: 0 / 3 images
处理后：Monthly usage: 1 / 3 images （刷新后）
再处理：Monthly usage: 2 / 3 images
再处理：Monthly usage: 3 / 3 images （额度用尽）
```

---

## 📋 请提供重启后的日志

重启服务器后，请提供：

### 1. 浏览器控制台日志（复制关键部分）

重点关注：
```javascript
[CreditsDisplay] Mode: LOADING but credits is null (calling API anyway)  ← 应该看到这个
[CreditsDisplay] Response status: 200                                   ← 应该看到这个
[CreditsDisplay] SUCCESS - Got data: {...}                             ← 应该看到这个
```

### 2. 终端日志（特别是查询结果）

重点关注：
```
[Credits Check] Query result count: X  ← 这个数字是多少？
```

### 3. 如果看到错误，请提供完整错误信息

特别是：
- 任何红色的错误消息
- API 返回的状态码（如果不是 200）
- 任何异常或崩溃信息

---

## 🎯 预期完整流程

当一切正常工作时，完整的日志流程应该是：

### 页面加载
```javascript
[CreditsDisplay] ===== COMPONENT RENDERED =====
[CreditsDisplay] Status: loading
[CreditsDisplay] :::: useEffect TRIGGERED ::::
[CreditsDisplay] Mode: LOADING but credits is null (calling API anyway)
[CreditsDisplay] Calling /api/credits/check-ip...
[CreditsDisplay] SUCCESS - Got data: {tier: 'unverified', used: 0, limit: 3, remaining: 3}
```

### 处理一张图片
```javascript
[Mock API] Processing history recorded successfully
```

### 页面刷新（手动或自动）
```javascript
[CreditsDisplay] :::: useEffect TRIGGERED ::::
[CreditsDisplay] Mode: LOADING but credits is null (calling API anyway)
[CreditsDisplay] SUCCESS - Got data: {tier: 'unverified', used: 1, limit: 3, remaining: 2}
```

页面上显示：
```
Monthly usage: 1 / 3 images
Remaining: 2 images
```

---

## 🏁 完成！

操作步骤：
1. ✅ 停止服务器 (Ctrl+C)
2. ✅ 重启服务器 (npm run dev)
3. ✅ 清除浏览器数据
4. ✅ 访问 http://127.0.0.1:3000/convert
5. ✅ 查看浏览器控制台日志
6. ✅ 查看终端日志
7. ✅ 处理一张图片并验证额度更新

如果一切正常，额度应该正确更新！

如果有任何问题，请提供**重启后的完整日志**，我会帮你进一步分析。
