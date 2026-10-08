# AM-001 — Mobile-First Application Mandate

**Status:** Approved · **Priority:** P0 · **Applies to:** All HOMIQ releases, roles, pages, and features

## Binding principle
Every HOMIQ feature, page, interaction, and workflow must be conceived, designed, implemented, and tested for mobile devices first. Tablet and desktop are adaptive extensions of the mobile experience, not the primary design target.

## Implementation rules
1. Design first at 390 CSS px and verify at 320, 375, 430 CSS px, tablet and desktop widths.
2. Use touch-first interactions, with primary touch targets generally at least 44×44 CSS px.
3. Place primary navigation in a mobile-appropriate bottom navigation pattern where applicable; preserve context in multi-step workflows.
4. No horizontal scrolling for primary application content; never conceal essential actions at narrow widths.
5. Keep primary actions reachable, respect device safe areas and virtual keyboards.
6. Optimize images, defer noncritical resources, and avoid excessive initial payload.
7. Meet accessibility requirements: semantic labels, focus visibility, keyboard navigation, sufficient contrast and reduced-motion support.
8. Customer, provider, company, and administrator critical workflows must remain fully usable on mobile.

## Definition of done
A feature is not complete until its mobile workflow is verified at the prescribed viewports, with touch, keyboard, responsive layout, validation, loading, empty and error states. Desktop-only success does not qualify.

## Governance
Every feature entry, page registry item, task flow, pull request and acceptance test must reference AM-001. Exceptions require explicit documented approval before implementation.
