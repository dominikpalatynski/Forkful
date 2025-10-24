# Mobile Navigation Improvements - Business Specification

**Version:** 1.0
**Date:** 2025-10-24
**Status:** Approved for Implementation

---

## Executive Summary

This specification defines improvements to the recipe list interface components to enhance mobile usability and accessibility while maintaining existing desktop functionality. The changes implement a stack-first responsive layout that complies with WCAG 2.1 AA and WCAG 2.2 accessibility standards.

---

## Technology Context

### Tech Stack Reference

Per [.ai/tech-stack.md](../.ai/tech-stack.md), this project uses:

- **Astro 5** - SSR-enabled framework for optimal performance
- **React 19** - Interactive UI components
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first responsive styling
- **Shadcn/ui** - Accessible component library

All changes must align with these technologies and leverage their responsive capabilities.

---

## Business Objectives

### Primary Goals

1. **Improve Mobile Search Experience** - Maximize search input usability on mobile devices
2. **Enhance Touch Target Accessibility** - Ensure all interactive elements meet 44×44px minimum size
3. **Maintain Desktop Functionality** - Preserve existing desktop layout and behavior
4. **Comply with Accessibility Standards** - Achieve WCAG 2.1 AA and WCAG 2.2 compliance
5. **Reduce User Friction** - Minimize pagination space consumption on mobile

### Success Metrics

- Search input width ≥ 280px on mobile devices
- All buttons meet minimum 44×44px touch target size
- Zero WCAG violations introduced
- Desktop layout remains unchanged
- Vertical space reduction for pagination on mobile

---

## Scope of Changes

### Affected Components

1. **[RecipeListHeader](../../src/components/recipes/RecipeListHeader.tsx)** - Primary navigation and actions
2. **[SearchInput](../../src/components/recipes/SearchInput.tsx)** - Search functionality
3. **[PaginationControls](../../src/components/recipes/PaginationControls.tsx)** - Page navigation
4. **[RecipeListView](../../src/components/recipes/RecipeListView.tsx)** - Container component

### Out of Scope

- [TagFilter](../../src/components/recipes/TagFilter.tsx) - No changes required
- [RecipeGrid](../../src/components/recipes/RecipeGrid.tsx) - No changes required
- Search functionality logic - Behavior remains unchanged
- Pagination logic - Only visual layout changes

---

## Component Requirements

## 1. RecipeListHeader Component

### Current Behavior (Desktop)

- Horizontal layout with search input and action buttons side-by-side
- Search input occupies flexible width (flex-1)
- Two action buttons displayed inline with icons and text:
  - "Z AI" button (outline variant, Sparkles icon)
  - "Nowy przepis" button (primary variant, Plus icon)

### Required Changes

#### Mobile Layout (< 768px)

- **Layout Structure:** Vertical stack with two distinct rows
  - **Row 1:** Search input at full width
  - **Row 2:** Action buttons below search input

- **Search Input Requirements:**
  - Full width (100%) of container
  - Minimum height: 44px
  - Maintains all existing functionality (clear button, placeholder, icon)

- **Action Buttons Requirements:**
  - Display horizontally side-by-side
  - Each button occupies equal width within row
  - Minimum height: 44px
  - Maintain existing icons and labels
  - Preserve existing click handlers and navigation
  - Maintain visual distinction between variants (outline vs primary)

- **Spacing Requirements:**
  - Vertical gap between search row and button row: 12-16px
  - Horizontal gap between buttons: 8-12px
  - Preserve existing horizontal padding/margins

#### Desktop Layout (≥ 768px)

- **No Changes** - Maintain current horizontal layout
- Search input remains flex-1
- Buttons remain inline on the right side
- All existing spacing preserved

### Accessibility Requirements

- Maintain existing ARIA labels and attributes
- Ensure logical tab order: Search → "Z AI" button → "Nowy przepis" button
- Touch targets minimum 44×44px on mobile
- Preserve keyboard navigation functionality
- Maintain data-testid attributes for testing

---

## 2. PaginationControls Component

### Current Behavior

- Two-row layout on mobile (sm breakpoint):
  - Row 1: Navigation buttons + page indicator
  - Row 2: Page size selector with label
- Single-row layout on desktop
- Left-aligned content

### Required Changes

#### Mobile Layout (< 640px)

- **Layout Structure:** Maintain vertical stack, optimize spacing

- **Navigation Row:**
  - "Poprzednia" and "Następna" buttons
  - Page indicator text between buttons ("Strona X z Y")
  - Reduce button text to shorter labels to save space
  - Buttons minimum height: 40px (acceptable for sm variant)

- **Page Size Row:**
  - Label: "Wyników na stronie:"
  - Dropdown selector with options: 10, 20, 50, 100
  - Maintain native select element styling

- **Spacing Requirements:**
  - Reduce vertical gap between rows from current to 8-12px
  - Maintain horizontal gaps within rows
  - Optimize overall height footprint

#### Desktop Layout (≥ 640px)

- **Layout Structure:** Horizontal single row
- Navigation controls on left
- Page size selector on right
- All elements inline with consistent spacing

### Visual Requirements

- Maintain existing button variants (outline, sm size)
- Preserve disabled state styling
- Keep existing border/background styling for select element
- Ensure visual alignment of all elements

### Accessibility Requirements

- Maintain button disabled states with proper ARIA attributes
- Preserve label association with select element
- Ensure page indicator is announced to screen readers
- Touch targets minimum 40×40px acceptable for compact controls
- Maintain keyboard navigation for all interactive elements

---

## 3. SearchInput Component

### Current Behavior

- Search icon on left (absolute positioned)
- Input field with left padding for icon
- Clear button (X) on right when value exists
- Responsive to parent width

### Required Changes

#### All Breakpoints

- **No Structural Changes** - Component is already responsive
- Inherits width from parent container
- Minimum height maintained at 44px through Input component
- Clear button remains conditionally rendered

#### Verification Requirements

- Ensure component responds correctly to full-width parent on mobile
- Verify icon positioning remains correct at all widths
- Confirm clear button functionality preserved
- Test with various search term lengths

---

## 4. RecipeListView Component

### Current Behavior

- Container with padding and responsive grid
- Sequential rendering: Header → TagFilter → Grid → Pagination
- Conditional rendering based on state

### Required Changes

#### All Breakpoints

- **No Direct Changes** - Component structure remains unchanged
- Child components (RecipeListHeader, PaginationControls) handle their own responsive behavior
- Maintain existing spacing between sections (mb-6)

#### Verification Requirements

- Ensure responsive changes in child components don't break container layout
- Verify vertical rhythm maintained at all breakpoints
- Confirm no unintended layout shifts
- Test with various content states (empty, loading, populated)

---

## Responsive Breakpoints

### Breakpoint Strategy (Tailwind CSS)

- **Mobile First:** < 640px (sm) - Primary mobile phones
- **Small Tablet:** ≥ 640px (sm) - Large phones, small tablets
- **Tablet/Desktop:** ≥ 768px (md) - Tablets, small desktops
- **Desktop:** ≥ 1024px (lg) - Standard desktops

### Component-Specific Breakpoints

- **RecipeListHeader:** Switches at `md` (768px)
- **PaginationControls:** Switches at `sm` (640px)
- **SearchInput:** Fluid, no specific breakpoint
- **RecipeListView:** No changes, inherits from children

---

## Accessibility Compliance

### WCAG 2.1 AA Requirements

- **2.5.5 Target Size:** All interactive elements ≥ 44×44px on mobile
- **1.4.3 Contrast:** Maintain minimum 4.5:1 text contrast, 3:1 for UI components
- **2.4.3 Focus Order:** Logical tab sequence preserved
- **2.4.7 Focus Visible:** Clear focus indicators on all interactive elements
- **4.1.2 Name, Role, Value:** Proper ARIA attributes maintained

### WCAG 2.2 Compliance

- **2.4.11 Focus Not Obscured:** No sticky/fixed elements obscuring focused content
- **2.4.12 Focus Appearance:** Minimum 2px focus outline with sufficient contrast
- **2.5.8 Target Size (Enhanced):** Striving for 44×44px minimum (already met)

### Testing Requirements

- Keyboard navigation testing across all breakpoints
- Screen reader testing (VoiceOver on iOS, TalkBack on Android)
- Touch target verification on physical devices
- Focus indicator visibility in light/dark modes

---

## Design Principles

### Mobile-First Approach

1. **Vertical Stacking** - Natural reading flow, easier touch interaction
2. **Full-Width Elements** - Maximize usable space on small screens
3. **Adequate Spacing** - Prevent accidental taps, improve readability
4. **Progressive Enhancement** - Add complexity as screen size increases

### Desktop Preservation

1. **No Regression** - Existing desktop layout must remain pixel-perfect
2. **Efficient Use of Space** - Horizontal layout leverages wider screens
3. **Familiar Patterns** - Users expect traditional web patterns on desktop

### Universal Principles

1. **Clarity Over Density** - Prioritize usability over fitting more content
2. **Consistency** - Similar patterns across components
3. **Accessibility First** - Compliance is mandatory, not optional
4. **Performance** - Responsive changes must not impact load time

---

## User Experience Requirements

### Mobile User Stories

**As a mobile user,**

- I need a larger search input so I can easily tap and type recipe names
- I need prominent action buttons so I can quickly create new recipes
- I need compact pagination so more recipes are visible per screen
- I need clear touch targets so I don't accidentally tap wrong buttons

### Desktop User Stories

**As a desktop user,**

- I expect the existing layout to remain unchanged
- I need efficient use of horizontal space
- I need familiar web patterns for navigation
- I need quick access to all functions in a single glance

### Accessibility User Stories

**As a keyboard user,**

- I need logical tab order that follows visual layout
- I need visible focus indicators on all interactive elements
- I need no hidden or obscured focused elements

**As a screen reader user,**

- I need proper ARIA labels on all controls
- I need clear announcement of page state and actions
- I need semantic HTML structure

**As a user with motor impairments,**

- I need large touch targets (≥ 44×44px)
- I need adequate spacing between interactive elements
- I need buttons that don't require precision tapping

---

## Implementation Constraints

### Must Maintain

- All existing TypeScript types and interfaces
- All existing React hooks and state management
- All existing event handlers and navigation logic
- All existing data-testid attributes for E2E testing
- All existing ARIA labels and accessibility attributes
- All existing Shadcn/ui component variants and props

### Must Use

- Tailwind CSS responsive utilities (sm:, md:, lg: prefixes)
- Existing Shadcn/ui components (Button, Input, Label)
- Existing icon components from lucide-react
- React best practices (useCallback, memo where appropriate)

### Must Avoid

- Adding new dependencies or libraries
- Creating custom CSS outside Tailwind utilities
- Modifying component business logic
- Breaking existing TypeScript type safety
- Introducing new state management
- Creating accessibility regressions

---

## Testing Requirements

### Visual Regression Testing

- Screenshot comparison at breakpoints: 375px, 640px, 768px, 1024px, 1440px
- Light and dark mode verification
- Focus state visibility
- Hover state preservation

### Functional Testing

- Search input accepts text and clears correctly
- Action buttons navigate to correct routes
- Pagination buttons change pages
- Page size selector updates results
- All existing E2E tests continue to pass

### Accessibility Testing

- Automated: axe-core or similar tool (0 violations)
- Manual keyboard navigation through all components
- Screen reader testing (at least 2 readers)
- Touch target size validation on physical devices

### Responsive Testing

- Test on physical devices: iPhone SE, iPhone Pro, iPad, Android phones
- Browser DevTools responsive mode verification
- Portrait and landscape orientation testing
- Text scaling verification (up to 200%)

---

## Success Criteria

### Completion Criteria

- ✅ RecipeListHeader stacks vertically on mobile, horizontal on desktop
- ✅ SearchInput occupies full width on mobile
- ✅ Action buttons are full-width and stacked on mobile
- ✅ PaginationControls reduces vertical space on mobile
- ✅ All touch targets meet 44×44px minimum on mobile
- ✅ Desktop layout remains pixel-perfect unchanged
- ✅ All existing tests pass without modification
- ✅ Zero new WCAG violations introduced
- ✅ TypeScript compilation succeeds with no errors

### Quality Criteria

- Code follows existing project patterns and conventions
- Responsive utilities used consistently (Tailwind)
- Component props and types remain unchanged
- Git commit follows project standards
- Documentation updated if needed (inline comments)

---

## Rollout Considerations

### Risk Assessment

- **Low Risk:** Changes are purely presentational, no logic modifications
- **Medium Risk:** Responsive changes could affect existing E2E tests if selectors rely on layout
- **Mitigation:** Comprehensive testing before merge, gradual rollout if possible

### Rollback Plan

- Changes are isolated to component styling
- Git revert can restore previous state
- No database or API changes involved

### Monitoring

- User analytics on mobile vs desktop usage patterns
- Error monitoring for any React rendering issues
- Performance metrics (no degradation expected)

---

## References

### Internal Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project coding guidelines
- [Tech Stack](.ai/tech-stack.md) - Technology decisions
- [Astro Configuration](../../astro.config.mjs) - Framework setup
- [Tailwind Configuration](../../tailwind.config.mjs) - Styling setup

### External Standards

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility guidelines
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) - Latest accessibility standards
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) - Touch target guidelines
- [Material Design](https://m3.material.io/) - Responsive patterns reference

### Research Sources

- Baymard Institute - Mobile UX research
- Nielsen Norman Group - Usability patterns
- US Web Design System (USWDS) - Accessibility best practices

---

## Appendix: Component Hierarchy

```
RecipeListView
├── RecipeListHeader
│   ├── SearchInput
│   │   ├── Search Icon (lucide-react)
│   │   ├── Input (shadcn/ui)
│   │   └── Clear Button (conditional)
│   └── Action Buttons
│       ├── "Z AI" Button (shadcn/ui)
│       └── "Nowy przepis" Button (shadcn/ui)
├── TagFilter (unchanged)
├── RecipeGrid (unchanged)
└── PaginationControls
    ├── Navigation Controls
    │   ├── "Poprzednia" Button
    │   ├── Page Indicator
    │   └── "Następna" Button
    └── Page Size Selector
        ├── Label
        └── Select Element
```

---

## Approval

**Reviewed by:** Frontend Specialist
**Approved for Implementation:** 2025-10-24
**Implementation Priority:** High
**Estimated Effort:** Low-Medium (styling changes only)

---

**End of Specification**
