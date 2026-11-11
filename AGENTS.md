# Blog repository instructions

This repository is the public Astro blog for the **听我说 / Hear Me Out** project. Its sibling Studio repository is `../tingwoshuo-Studio`.

## Required session start

Before beginning work in a new or resumed Codex chat, read the cross-project source of truth:

1. `../tingwoshuo-Studio/PROGRESS.md`
2. `../tingwoshuo-Studio/ROADMAP.md`
3. `../tingwoshuo-Studio/AGENTS.md`

Then check `git status`, branch, `HEAD`, and `origin/main` in both this repository and the Studio sibling. Read this repository's `README.md`, `CONTENT_GUIDE.md`, and `DESIGN_SYSTEM.md` for work that touches those areas. Verify feature claims against the code and latest build/check evidence; do not repeat completed work or discard existing local changes.

## Architecture and working rules

- Astro 5 static generation with TypeScript, Astro Content Collections/Zod, Tailwind CSS 4, Markdown/MDX, Pagefind, RSS, and sitemap. The production build command is `pnpm build`; validation is `pnpm check`.
- Content lives under `src/content/life/` and `src/content/tech/`. Keep frontmatter valid against `src/content.config.ts`; `title`, non-empty `description`, and `pubDate` are required. Stable filenames are public URL slugs.
- Pages, layouts, components, content queries, site settings, theme tokens, and content styles live in their existing `src/` areas. Follow current patterns and the design system instead of replacing the architecture.
- `tools/editor/` is a local loopback-only editor. The Cloudflare-hosted Studio is a separate sibling project. Do not conflate their routes, storage, or deployment.
- Studio publishes directly to the configured `main` branch and triggers Cloudflare Pages. Article deletion from Studio is also a branch commit. Never push, deploy, edit Cloudflare resources, or perform live destructive operations unless the user explicitly requests it.
- Do not create branches; the user wants changes on the existing main checkout. Do not alter Studio/blog integration contracts or the two-repository arrangement without discussing the architecture change first.
- Preserve article wording and metadata outside the user's requested scope. Do not fabricate content or mark drafts public without explicit intent.
- Use Node `>=22.23.4` as declared in `package.json`. After content/schema changes, run `pnpm check` and `pnpm build` when verification is requested or needed; record actual outcomes in the canonical `../tingwoshuo-Studio/PROGRESS.md`.

## Cross-project documentation

The Studio repository owns the single canonical `PROGRESS.md` and `ROADMAP.md` for both projects so their shared publishing state does not drift across duplicate copies. At the end of a feature or fix, update that progress file and adjust the roadmap if priorities or acceptance criteria changed. If the blog's implementation and any docs disagree, use code plus verified build/check results as truth and correct the relevant documentation.
