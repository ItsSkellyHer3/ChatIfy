## 2025-05-14 - [A11y] Descriptive ARIA labels for counter-based buttons
**Learning:** When adding `aria-label` to icon-only buttons that also display a dynamic counter (like reaction counts), the `aria-label` should incorporate the counter value. This ensures screen reader users receive all the information presented visually, as the `aria-label` typically overrides the button's internal text content.
**Action:** Always check if an icon-only button has associated text (like counts or badges) and include that information in the `aria-label`.

## 2025-05-14 - [UX] Discord-inspired 4-column layout
**Learning:** For chat applications, users often prefer the familiarity and spatial efficiency of a flush, multi-column layout over a "bento-box" style with gaps and shadows. Standardizing typography (single font, limited weights) also significantly reduces cognitive load.
**Action:** When designing complex dashboards or chat UIs, prioritize a flush grid structure and clean typography to maximize focus.
