# Design System Specification: Clinical Precision & Tonal Depth

## 1. Overview & Creative North Star
**Creative North Star: "The Clinical Curator"**
This design system moves away from the sterile, rigid "grid-of-boxes" common in medical software. Instead, it adopts an editorial approach to dental ERP management. We treat patient data not as a database entry, but as a curated medical record. By leveraging intentional white space, high-contrast typography scales, and overlapping surface layers, we create an environment that feels authoritative yet calming. The "template" look is rejected in favor of an asymmetric, sophisticated layout that guides the practitioner’s eye through complex data with surgical precision.

---

## 2. Colors & Surface Philosophy
The palette is rooted in medical blues and architectural grays, designed to reduce cognitive load during long clinical shifts.

### The "No-Line" Rule
To achieve a premium, high-end feel, **1px solid borders are strictly prohibited for sectioning.** Structural boundaries must be defined solely through background color shifts. For instance, a side panel in `surface-container-low` should sit directly against a `background` main stage without a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create depth:
- **Level 0 (Base):** `surface` (#f7f9fb) — The foundation of the application.
- **Level 1 (Sections):** `surface-container-low` (#f0f4f7) — Used for large structural areas like sidebars.
- **Level 2 (Active Work):** `surface-container-highest` (#d9e4ea) — For active data tables or patient charts.
- **Level 3 (Focus):** `surface-container-lowest` (#ffffff) — Reserved for the "top sheet" or individual cards to provide maximum pop.

### The Glass & Gradient Rule
For floating elements (modals, dropdowns, or "Quick Action" menus), use semi-transparent `surface` colors with a `backdrop-blur` of 12px-20px. 
**Signature Texture:** Use a subtle linear gradient (Top-Left to Bottom-Right) transitioning from `primary` (#006496) to `primary-dim` (#005784) for primary CTAs. This creates a "gem-like" depth that feels expensive and intentional.

---

## 3. Typography
We utilize a dual-typeface system to balance clinical efficiency with high-end editorial aesthetics.

- **The Voice (Manrope):** Used for `display` and `headline` roles. Its geometric yet organic curves provide a "Modern Boutique" feel to clinic names and section headers.
- **The Engine (Inter):** Used for `title`, `body`, and `label` roles. This is our workhorse for patient data, ensuring maximum legibility at small sizes (e.g., `label-sm` at 0.6875rem for tooth chart notations).

**Hierarchy Usage:** 
Use `display-sm` for high-level dashboard metrics (e.g., "Daily Revenue") to create a sense of scale. Contrast this with `label-md` in `on-surface-variant` for metadata to ensure the most important information "screams" while the secondary information "whispers."

---

## 4. Elevation & Depth
In this system, depth is a function of light and tone, not shadows.

- **Tonal Layering:** Depth is achieved by "stacking." A card using `surface-container-lowest` placed on a `surface-container-high` background creates a natural lift.
- **Ambient Shadows:** Shadows are rare. When a floating modal is required, use a 32px blur with a 4% opacity. The shadow color must be tinted using `on-surface` (#2a3439) to ensure it looks like a natural occlusion of light rather than a "drop shadow."
- **The "Ghost Border" Fallback:** If a container must sit on an identical color (e.g., for accessibility in a dense list), use a Ghost Border: `outline-variant` (#a9b4b9) at **15% opacity**.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-dim`), `on-primary` text, `md` (0.375rem) rounded corners.
- **Secondary:** `secondary-container` fill, no border. For "Soft" actions.
- **Tertiary:** Ghost style. No fill, no border, `primary` text. Used for "Cancel" or "Go Back."

### Input Fields
- **Treatment:** Use `surface-container-low` for the fill. 
- **States:** On focus, the background shifts to `surface-container-lowest` with a 2px `primary` underline—avoid a full bounding box focus ring to keep the layout "open."

### Cards & Lists
- **The Anti-Divider Rule:** Explicitly forbid 1px horizontal dividers. To separate patient records in a list, use a `6` (1.5rem) vertical spacing gap or a subtle alternating background shift between `surface` and `surface-container-low`.

### Specialized Dental Components
- **The Tooth Map:** Utilize `outline-variant` for inactive teeth and `primary` for teeth requiring treatment. Use `xl` (0.75rem) roundedness for selection overlays to soften the clinical feel.
- **Status Chips:** Use `tertiary-container` for "Scheduled" and `error-container` for "Overdue." Chips must use `full` (9999px) rounding to contrast against the `md` roundedness of the main UI.

---

## 6. Do’s and Don’ts

### Do:
- **Embrace White Space:** Use spacing `8` (2rem) and `10` (2.5rem) between major modules to let the data "breathe."
- **Use Intentional Asymmetry:** In a patient profile, let the image and name overlap the header background to break the "grid."
- **Prioritize Tonal Shifts:** Always try to define a new section with a background color shift before reaching for a line or shadow.

### Don't:
- **No Heavy Shadows:** Never use high-opacity, dark-gray shadows. It breaks the "Clinical Curator" aesthetic.
- **No Pure Black:** Ensure all text uses `on-surface` (#2a3439) for a softer, more professional ink-to-paper feel.
- **No Border-Clutter:** Avoid nesting borders within borders. If a container is inside another container, use color to distinguish them, not strokes.