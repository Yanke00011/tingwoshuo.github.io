# 听我说 · Design System

## 品牌
- 主体名称：听我说 · HEAR ME OUT
- 署名：小张科技 · XIAOZHANG TECHNOLOGY
- 标志：`public/brand/mark.svg`（独立图形），`public/brand/wordmark.svg`（中英文组合）
- 色彩：暖白纸面、石墨文字、鼠尾草绿强调。深色主题使用相同语义色并提升对比度。

## 字体与排版
- 系统字体优先：SF Pro、苹方、Hiragino Sans GB、微软雅黑与系统 sans-serif 回退。代码使用 SF Mono / Consolas。
- 显示标题使用 `clamp(3.25rem, 7vw, 6rem)`，页面标题 `clamp(2rem, 4.2vw, 3.5rem)`，章节标题 `clamp(1.45rem, 2vw, 2rem)`。
- 中文正文基准约 17px，行高 1.94；文章宽度 720px，移动端正文 16px、行高 1.9。
- 文章标题行高 1.38，段落上下间距约 1.45em；链接使用强调绿与细下划线，引用左侧使用品牌强调色。
- 代码区使用等宽字体、深色底和横向滚动；表格在容器内横向滚动；图片圆角 16px、说明文字居中。
- 语义文字色限制为默认、次要、蓝、绿、橙、红、紫，并提供浅色/深色映射；强调背景使用柔和黄色。

## 布局与组件
- 主内容最大宽度 1120px，阅读区 720px；页面左右边距桌面 24px、手机 18px。
- 响应断点 760px 与 640px；移动布局优先单列。
- 圆角层级以 12px（小控件）、18–20px（模块）、24px（大卡片）为主。
- 动画短、轻，尊重 `prefers-reduced-motion`。
