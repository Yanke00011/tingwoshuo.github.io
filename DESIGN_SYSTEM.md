# 设计系统

## 视觉基调

「听我说」使用安静的编辑式布局：暖白底色、深灰文字、柔和苔绿色作为品牌强调色。闲聊入口加入暖灰米色，技术入口使用低饱和灰绿。避免把所有内容装进玻璃卡片；玻璃只用于顶部导航和搜索层。

## Design Tokens

全局 token 位于 `src/styles/global.css`：

- 色彩：`--bg`、`--surface`、`--surface-soft`、`--text`、`--muted`、`--line`、`--accent`、`--accent-wash`
- 字体：系统中文字体优先（Apple 系统字体、苹方、思源兼容 fallback）；等宽代码栈单独设置，不加载外部字体
- 形状：`--radius`、卡片局部圆角
- 深度：`--shadow`、玻璃 `--glass`
- 阅读：`--content` 为页面最大宽度，`--reading` 为正文行宽
- 动效：`--ease`，并统一处理 `prefers-reduced-motion`

暗色主题覆盖相同语义变量，通过 `html[data-theme="dark"]` 激活。用户选项存在 `localStorage`；没有保存选择时，根据系统配色设置首次主题。

## 组件职责

- `BaseLayout.astro`：SEO、全局字体/样式、Header/Footer、阅读进度、复制与图片灯箱
- `Header.astro`：导航、主题按钮、搜索弹窗、窄屏菜单
- `PostCard.astro`：统一文章摘要卡片
- `src/pages/`：路由级布局与页面内容
- `src/lib/posts.ts`：统一文章查询、日期、slug 路径、阅读时间和标签逻辑

新增页面应优先复用 token 与组件；不要在页面中另造颜色或交互库。移动布局断点目前主要是 640–760px 区间，文章目录在窄屏转到正文上方。

## 无障碍与动效

有跳转正文链接、语义导航、可见键盘焦点、按钮 ARIA 名称、搜索 Escape 关闭、图片灯箱 Escape 关闭，并支持 `prefers-reduced-motion`。导航与搜索的玻璃层在减少透明效果的设置下退化为不透明表面。
