# Design System Specification: The Clinical Sanctuary

## 1. Overview & Creative North Star
The "Clinical Sanctuary" is the guiding philosophy of this design system. We are moving away from the cluttered, grid-locked aesthetic of traditional medical ERPs and toward an editorial, high-end boutique experience. 

**The Creative North Star:** This system is a digital extension of a premium dental practice—sterile but serene, authoritative but approachable. We achieve this through **Intentional Asymmetry** and **Tonal Depth**. By breaking the rigid "box-in-a-box" layout, we allow the eye to rest on key patient data. We prioritize "breathing room" (negative space) as a functional tool to reduce cognitive load for practitioners in high-stress clinical environments.

---

## 2. Colors: The Palette of Trust
The palette is rooted in medical precision, utilizing a spectrum of sophisticated blues (`primary`) and layered greys (`surface`).

### The "No-Line" Rule
To achieve a premium, editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries between different functional areas must be defined solely through background color shifts. For example, a side panel in `surface-container-low` sits directly against a `surface` main content area. The eye perceives the edge through the shift in tone, not a physical line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine papers.
*   **Base:** `surface` (#f8fafb)
*   **Secondary Sections:** `surface-container-low` (#f0f4f6)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Highlighted Utility:** `surface-container-high` (#e1eaed)

### The "Glass & Gradient" Rule
Standard flat buttons feel like templates. To inject "soul" into the ERP:
*   **Primary CTAs:** Use a subtle linear gradient from `primary` (#1e667f) to `primary-container` (#bde9ff) at a 135-degree angle.
*   **Floating Elements:** For overlays or modals, use Glassmorphism. Apply `surface` at 80% opacity with a `20px` backdrop-blur. This ensures the clinical context remains visible beneath the active task.

---

## 3. Typography: Editorial Precision
We utilize two distinct typefaces to balance character with clinical utility.

*   **Display & Headlines (Manrope):** A geometric sans-serif that feels modern and architectural. Use `display-lg` (3.5rem) for high-level clinic metrics and `headline-md` (1.75rem) for patient names. The generous x-height of Manrope conveys stability.
*   **Body & Labels (Inter):** The gold standard for readability. Use `body-md` (0.875rem) for all clinical notes. Inter’s tall lowercase letters ensure that complex dental terminology remains legible even on smaller mobile screens.

**Hierarchy Strategy:** Use `title-lg` (#2a3437) for section headers, but pair it with a `label-sm` in `primary` (#1e667f) all-caps to create an "Editorial Tag" effect above the header.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, shadows are a whisper, not a shout.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card on a `surface-container` background to create a soft, natural lift without any shadow.
*   **Ambient Shadows:** For elements that truly float (like a "New Appointment" FAB), use a large, diffused shadow: `0px 12px 32px rgba(42, 52, 55, 0.06)`. The shadow color is a tinted version of `on-surface`, never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use the `outline-variant` (#a9b4b7) at **15% opacity**. It should be felt more than seen.

---

## 5. Components: Refined Utility

### Buttons
*   **Primary:** Gradient fill (Primary to Primary-Container), `on-primary` text, `md` (0.375rem) roundedness.
*   **Secondary:** `surface-container-highest` background, `primary` text. No border.
*   **States:** On hover, increase the gradient intensity. On press, scale the component to 98%.

### Input Fields
*   **Styling:** Use a `surface-container-low` background with a `Ghost Border`.
*   **Focus State:** Transition the background to `surface-container-lowest` and the border to `primary` at 100% opacity.
*   **Labels:** Always use `label-md` positioned above the field, never as a placeholder.

### Cards & Lists
*   **Rule:** Forbid divider lines. 
*   **Separation:** Use `spacing-6` (1.3rem) of vertical white space or shift the background color of alternating list items to `surface-container-low`.
*   **Dental Context:** Use `xl` (0.75rem) roundedness for patient profile cards to make the software feel "soft" and human-centric.

### Specialty Component: The Treatment Timeline
*   **Design:** Use a vertical track using `primary-container`. Instead of nodes, use `surface-container-lowest` cards that overlap the track slightly to create a layered, 3D effect.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. A patient’s chart can be 65% width while the sidebar is 35%, creating a dynamic, editorial feel.
*   **Do** use `primary-fixed-dim` for "soft" alerts that aren't critical errors.
*   **Do** use the full range of the Spacing Scale. If a layout feels "cramped," jump two steps up the scale (e.g., from `spacing-4` to `spacing-8`).

### Don’t
*   **Don’t** use pure black (#000000) for text. Always use `on-surface` (#2a3437) to maintain the medical-soft aesthetic.
*   **Don’t** use `DEFAULT` roundedness for everything. Use `full` for chips and `xl` for large containers to vary the visual rhythm.
*   **Don’t** use drop shadows on nested cards. Depth should be achieved through color shifts (`surface` tiers) only.