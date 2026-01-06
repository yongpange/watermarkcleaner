# 定价页面设计方案对比

> 生成时间：2026-01-06
>
> 文件用途：记录定价页面的三种UI/UX设计方案

## 🎯 背景

WatermarkCleaner 定价页面需要从原有的3个一次性购买计划（Starter/Standard/Premium）升级为新的定价结构：
- **Free 计划**：$0（10 Credits/月）
- **月度计划**：3个选项（Basic/Pro/Business）
- **年度计划**：2个选项（Yearly Basic/Yearly Pro）💰节省50%

## 📊 方案对比总览

| 特性 | 方案 1（垂直卡片） | 方案 2（水平卡片） | 方案 3（详情面板） |
| :--- | :--- | :--- | :--- |
| **用户体验** | ⭐⭐⭐⭐⭐ 清晰直观 | ⭐⭐⭐⭐ 对比性强 | ⭐⭐⭐ 专注但隐藏信息 |
| **实现难度** | 低（100%兼容） | 低（100%兼容） | 中（需修改组件） |
| **信息密度** | 适中 | 高 | 低 |
| **响应式适配** | ⭐⭐⭐⭐⭐ 完美 | ⭐⭐⭐⭐ 良好 | ⭐⭐⭐ 需额外工作 |
| **视觉吸引力** | ⭐⭐⭐⭐ 层次清晰 | ⭐⭐⭐ 稍显拥挤 | ⭐⭐⭐⭐ 现代感 |
| **代码兼容性** | ⭐⭐⭐⭐⭐ 100% | ⭐⭐⭐⭐⭐ 100% | ⭐⭐ 需重写逻辑 |

---

## 💎 方案 1：垂直卡片 + 嵌套单选（推荐）

**状态**：✅ **已实施**

### 设计特点
- Free/Monthly/Yearly 横向单选按钮
- Monthly/Yearly 下方垂直显示对应套餐
- 每个套餐独立卡片，包含完整信息
- 选中状态高亮显示

### 视觉布局

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      Pricing                                               ║
║      Get all features, build your AI SaaS startups fast.  ║
║                                                            ║
║  ┌──────────┬────────────┬──────────┐                     ║
║  │ ● Free   │ ○ Monthly  │ ○ Yearly │  ← 外层单选        ║
║  └──────────┴────────────┴──────────┘                     ║
║                                                            ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │  Free                                            │     ║
║  │  $0 USD                                          │     ║
║  │  Get started with basic features.               │     ║
║  │  ✓ 10 Credits/month                            │     ║
║  │  ✓ Limited usage                               │     ║
║  │  ✓ No watermark removal                        │     ║
║  │  ✓ Basic support                               │     ║
║  │  [ Get Started ]                               │     ║
║  │  Try free. Build your first project!           │     ║
║  └──────────────────────────────────────────────────┘     ║
║                                                            ║
║  人民币支付 👉 [WeChat/Alipay图标]                        ║
╚════════════════════════════════════════════════════════════╝

=== 选择 Monthly 后 ===

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      Pricing                                               ║
║      Get all features, build your AI SaaS startups fast.  ║
║                                                            ║
║  ┌──────────┬────────────┬──────────┐                     ║
║  │ ○ Free   │ ● Monthly  │ ○ Yearly │  ← 外层单选        ║
║  └──────────┴────────────┴──────────┘                     ║
║                                                            ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │  Basic                                           │     ║
║  │  $6.99/month                                     │     ║
║  │  Start building fast                             │     ║
║  │  ✓ 100 Credits/month                             │     ║
║  │  ✓ $0.07/credit                                  │     ║
║  │  ✓ 100 images/month                              │     ║
║  │  [ Get Started ]                                 │     ║
║  │  Pay once. Build unlimited projects!             │     ║
║  └──────────────────────────────────────────────────┘     ║
║                                                            ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │  Pro ⭐                                          │     ║
║  │  $9.99/month                                     │     ║
║  │  Build faster with more credits                  │     ║
║  │  ✓ 200 Credits/month                             │     ║
║  │  ✓ $0.05/credit                                  │     ║
║  │  ✓ 200 images/month                              │     ║
║  │  [ Get Started ]                                 │     ║
║  │  Pay once. Build unlimited projects!             │     ║
║  └──────────────────────────────────────────────────┘     ║
║                                                            ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │  Business                                        │     ║
║  │  $14.99/month                                    │     ║
║  │  Scale your AI SaaS startup                      │     ║
║  │  ✓ 500 Credits/month                             │     ║
║  │  ✓ $0.03/credit                                  │     ║
║  │  ✓ 500 images/month                              │     ║
║  │  [ Get Started ]                                 │     ║
║  │  Pay once. Build unlimited projects!             │     ║
║  └──────────────────────────────────────────────────┘     ║
║                                                            ║
║  人民币支付 👉 [WeChat/Alipay图标]                        ║
╚════════════════════════════════════════════════════════════╝
```

### 实施细节

#### 数据结构（英文）
```json
{
  "groups": [
    {"name": "free", "title": "Free"},
    {"name": "monthly", "title": "Monthly"},
    {"name": "yearly", "title": "Yearly"}
  ],
  "items": [
    {
      "group": "free",
      "title": "Free",
      "price": "$0",
      "interval": "one-time",
      "product_id": "free-plan",
      "features": ["10 Credits/month", "Limited usage", ...],
      ...
    },
    {
      "group": "monthly",
      "title": "Basic",
      "price": "$6.99",
      "interval": "month",
      "product_id": "basic-monthly",
      ...
    }
  ]
}
```

#### 组件修改

**文件**：`src/components/blocks/pricing/index.tsx`

```typescript
// 默认选中 Monthly
const [group, setGroup] = useState(
  pricing.groups?.find(g => g.name === "monthly")?.name ||
  pricing.groups?.[0]?.name ||
  "monthly"
);

// useEffect 优先加载 monthly
useEffect(() => {
  if (pricing.disabled) return;

  if (pricing.items && pricing.items.length > 0) {
    const monthlyItem = pricing.items.find(item => item.group === "monthly");
    if (monthlyItem) {
      setGroup(monthlyItem.group);
      setProductId(monthlyItem.product_id);
    } else {
      setGroup(pricing.items[0].group);
      setProductId(pricing.items[0].product_id);
    }
    setIsLoading(false);
  }
}, [pricing.items, pricing.disabled]);
```

### 优缺点

✅ **优点**：
- 100% 兼容现有代码，无需大规模重构
- 信息层次清晰，用户易于理解
- 移动端友好，垂直布局自然适配
- 实施速度快，只需更新 JSON 数据
- 视觉焦点集中，减少认知负担

❌ **缺点**：
- 页面高度较高，需要滚动查看
- 无法同时比较多个月度计划

---

## 💎 方案 2：水平卡片 + 内部单选（紧凑版）

**状态**：💡 **备选方案**

### 设计特点
- Free/Monthly/Yearly 横向单选按钮
- Monthly/Yearly 以水平网格显示
- 每行 3 个卡片（Monthly）或 2 个卡片（Yearly）
- 选中状态通过卡片样式体现

### 视觉布局

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      Pricing                                               ║
║      Get all features, build your AI SaaS startups fast.  ║
║                                                            ║
║  ┌──────────┬────────────┬──────────┐                     ║
║  │ ○ Free   │ ● Monthly  │ ○ Yearly │  ← 外层单选        ║
║  └──────────┴────────────┴──────────┘                     ║
║                                                            ║
║  ┌─────────────────┬─────────────────┬─────────────────┐  ║
║  │    ○ Basic      │     ● Pro ⭐    │   ○ Business    │  ║
║  │  $6.99/month    │  $9.99/month    │  $14.99/month   │  ║
║  ├─────────────────┼─────────────────┼─────────────────┤  ║
║  │  ✓ 100 Credits  │  ✓ 200 Credits  │  ✓ 500 Credits  │  ║
║  │  ✓ $0.07/credit │  ✓ $0.05/credit │  ✓ $0.03/credit │  ║
║  │  ✓ 100 imgs/mo  │  ✓ 200 imgs/mo  │  ✓ 500 imgs/mo  │  ║
║  │                 │                 │                 │  ║
║  │  [Get Started]  │  [Get Started]  │  [Get Started]  │  ║
║  └─────────────────┴─────────────────┴─────────────────┘  ║
║                                                            ║
║  === 选择 Yearly 后 ===                                    ║
║                                                            ║
║  ┌──────────────────────────┬──────────────────────────┐  ║
║  │      ○ Yearly Basic      │      ● Yearly Pro 💰     │  ║
║  │        $44.99/year       │        $69.99/year       │  ║
║  ├──────────────────────────┼──────────────────────────┤  ║
║  │  ✓ 1200 Credits/year     │  ✓ 2400 Credits/year     │  ║
║  │  ✓ $0.04/credit          │  ✓ $0.03/credit          │  ║
║  │  ✓ 1200 images/year      │  ✓ 2400 images/year      │  ║
║  │                          │                          │  ║
║  │  [Get Started]           │  [Get Started]           │  ║
║  └──────────────────────────┴──────────────────────────┘  ║
╚════════════════════════════════════════════════════════════╝
```

### 实施要点

**CSS 调整**：
```typescript
// 修改网格布局
<div className="w-full mt-0 grid gap-6 md:grid-cols-3">
  {monthlyItems.map(...)}
</div>

<div className="w-full mt-0 grid gap-6 md:grid-cols-2">
  {yearlyItems.map(...)}
</div>
```

### 优缺点

✅ **优点**：
- 信息密度高，适合直接对比
- 页面紧凑，无需滚动
- 视觉平衡，网格布局美观

❌ **缺点**：
- 移动端需要水平滚动或换行
- 卡片内容压缩，可读性降低
- 水平空间不足时显得拥挤

---

## 💎 方案 3：两栏主选 + 详情面板（现代版）

**状态**：🔄 **高级定制**

### 设计特点
- 左侧：垂直选择器
  - 外层选择：Free / Monthly / Yearly
  - 内层选择：具体套餐（3个或2个）
- 右侧：大卡片显示选中计划的完整详情
- 选中状态通过颜色和图标动画体现

### 视觉布局

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      Pricing                                               ║
║      Get all features, build your AI SaaS startups fast.  ║
║                                                            ║
║  ┌──────────────────┐  ┌────────────────────────────────┐ ║
║  │  ● Free          │  │  Free                          │ ║
║  │  ○ Monthly       │  │  $0 USD                        │ ║
║  │    ○ Basic       │  │                               │ ║
║  │    ● Pro ⭐      │  │  ✓ 10 Credits/month          │ ║
║  │    ○ Business    │  │  ✓ Limited usage             │ ║
║  │  ○ Yearly        │  │  ✓ No watermark removal      │ ║
║  │    ○ Yearly Basic│  │  ✓ Basic support             │ ║
║  │    ○ Yearly Pro  │  │                               │ ║
║  │                  │  │     [ Get Started ]            │ ║
║  │                  │  │  Try free...                   │ ║
║  └──────────────────┘  └────────────────────────────────┘ ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 实施要点

**组件重构**：
```typescript
// 需要较大改动 - 将单选和详情分离
return (
  <div className="grid lg:grid-cols-3 gap-8">
    {/* 左侧选择器 */}
    <div className="lg:col-span-1">
      <RadioGroup ...>
        {/* Free 选项 */}
        {/* Monthly 组（含3个子选项） */}
        {/* Yearly 组（含2个子选项） */}
      </RadioGroup>
    </div>

    {/* 右侧详情面板 */}
    <div className="lg:col-span-2">
      <SelectedPlanDetail selectedPlan={selectedPlan} />
    </div>
  </div>
);
```

**新增组件**：
```typescript
// 新建：components/blocks/pricing/selected-plan-detail.tsx
interface SelectedPlanDetailProps {
  selectedPlan: PricingItem;
}

export default function SelectedPlanDetail({ selectedPlan }: SelectedPlanDetailProps) {
  return (
    <div className="sticky top-8">
      {/* 大卡片显示详情 */}
      {/* 包含动画、进度条等 */}
    </div>
  );
}
```

### 优缺点

✅ **优点**：
- 现代感强，类似 SaaS 头部玩家设计
- 信息展示充分，可以添加详细说明
- 交互体验好，选择器与详情分离
- 适合添加动画和高级效果

❌ **缺点**：
- 需要完全重构现有组件
- 开发工作量大（2-3天）
- 移动端需要独立设计响应式
- 维护成本较高

---

## 🎯 最终决策

### 选择方案 1 的理由

1. **实施效率**：1小时内完成，无需改动组件逻辑
2. **兼容性**：100% 兼容现有代码框架
3. **用户体验**：层次清晰，符合用户直觉
4. **维护成本**：后续调整只需修改 JSON 配置
5. **响应式**：自动适配移动端，无需额外工作

### 实施状态

- ✅ 英文配置：`src/i18n/pages/pricing/en.json` - 已完成
- ✅ 中文配置：`src/i18n/pages/pricing/zh.json` - 已完成
- ✅ 组件修改：`src/components/blocks/pricing/index.tsx` - 默认值 monthly

### 后续优化建议

**Phase 2（可选）**:
- [ ] 添加内层单选按钮（卡片标题前加圆形选择）
- [ ] 选中卡片高亮效果（边框变蓝、背景微变）
- [ ] 添加月度/年度计划对比表格
- [ ] 统计用户选择行为（Google Analytics）

**Phase 3（高级）**:
- [ ] 迁移到方案 3（如果A/B测试显示转化率更高）
- [ ] 添加动态定价计算器
- [ ] 实现企业定制套餐（Contact Sales）

---

## 📚 附录

### 相关文件

**配置文件**：
- `src/i18n/pages/pricing/en.json` - 英文定价数据
- `src/i18n/pages/pricing/zh.json` - 中文定价数据

**组件文件**：
- `src/components/blocks/pricing/index.tsx` - 主组件
- `src/types/blocks/pricing.d.ts` - 类型定义

**接口文件**：
- `src/services/page.ts` - 数据获取服务

### 技术栈

- **框架**: Next.js 15 (App Router)
- **UI 组件**: Radix UI + Tailwind CSS 4
- **状态管理**: React useState/useEffect
- **支付集成**: Stripe Checkout
- **国际化**: next-intl

---

**文档版本**: 1.0
**最后更新**: 2026-01-06
**作者**: Claude Code AI
**状态**: 方案 1 已实施并上线
