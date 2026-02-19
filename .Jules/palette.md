## 2025-05-14 - [Accessibility & Keyboard Navigation]
**Learning:** Standardizing focus-visible styles and adding a "Skip to Content" link significantly improves the experience for keyboard-only users in complex, multi-column layouts. Icon-only buttons without ARIA labels are a major barrier to accessibility.
**Action:** Always include a `*:focus-visible` outline in the global CSS and ensure every icon-only button has an `aria-label` and `title`. Add a "Skip to Content" link to bypass dense navigation sidebars.
