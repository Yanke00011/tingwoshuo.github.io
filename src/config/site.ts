/** Central site identity and contact details. Replace example values before launch. */
export const site = {
  name: '听我说',
  englishName: 'HEAR ME OUT',
  description: '关于生活、技术，以及那些值得记录的瞬间。',
  url: 'https://example.com', // Replace with your production URL; keep canonical URLs accurate.
  language: 'zh-CN',
  author: '站点作者', // Example placeholder; customize in README.
  authorAvatar: '', // Optional path such as /images/avatar.jpg.
  email: '',
  github: '',
  copyrightStart: 2026,
  seo: { titleTemplate: '%s · 听我说', defaultTitle: '听我说 — Hear Me Out' },
} as const;
