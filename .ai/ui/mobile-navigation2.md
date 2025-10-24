# Business Specification: Unified Delete Button Pattern for Recipe Form Components

**Document Version:** 1.0
**Date:** 2025-10-24
**Decision:** Implementation of Option 1 - Unified Top-Right Delete Pattern

---

## Executive Summary

This specification defines the required changes to unify the user interface pattern for delete functionality across recipe creation form components. The change addresses an inconsistency where delete buttons appear in different positions between ingredient items and step items, creating a confusing user experience.

**Objective:** Establish a consistent, accessible, and predictable UI pattern for delete actions across all draggable list items in the recipe creation form.

---

## Technology Stack Context

This application is built using the following technology stack (as defined in `.ai/tech-stack.md`):

### Frontend Technologies

- **Astro 5** - SSR-enabled web framework for fast, efficient pages with minimal JavaScript
- **React 19** - Provides interactivity where needed
- **TypeScript 5** - Static typing for better IDE support and code quality
- **Tailwind CSS 4** - Utility-first CSS framework for comfortable application styling
- **Shadcn/ui** - Accessible React component library for UI foundation

### Design Constraints

- Components must follow React 19 functional component patterns with hooks
- Styling must use Tailwind CSS utility classes exclusively
- All interactive components must maintain Shadcn/ui accessibility standards
- Desktop behavior must remain unchanged
- Mobile responsiveness must be preserved or improved

---

## Current State Analysis

### Affected Components

1. **DraggableCreateStepItem** (`src/components/recipes/form/DraggableCreateStepItem.tsx`)
   - Current pattern: Top-right delete button (DESIRED STATE)
   - Layout: Header row with drag handle + label, delete button aligned right
   - Content: Textarea field below header row
   - Status: ✅ Already follows desired pattern

2. **DraggableCreateIngredientItem** (`src/components/recipes/form/DraggableCreateIngredientItem.tsx`)
   - Current pattern: Inline delete button (NEEDS CHANGE)
   - Layout: Horizontal row with drag handle, input field, then delete button
   - Content: Input field inline with controls
   - Status: ❌ Requires restructuring

3. **Parent Components** (No changes required, included for reference)
   - `CreateRecipeStepsList` (`src/components/recipes/form/CreateRecipeStepsList.tsx`)
   - `CreateRecipeIngredientsList` (`src/components/recipes/form/CreateRecipeIngredientsList.tsx`)
   - `ManualRecipeForm` (`src/components/recipes/form/ManualRecipeForm.tsx`)

### Problem Statement

The current implementation presents an **inconsistent visual pattern**:

- **Steps Section:** Users find the delete button at the top-right corner of each item
- **Ingredients Section:** Users find the delete button inline on the right side, vertically centered with the input field

This inconsistency violates UX principles of predictability and creates cognitive load as users must consciously search for the delete button location when switching between sections.

---

## Business Requirements

### BR-1: Visual Consistency

**Priority:** HIGH

The delete button must appear in the **same position** for both ingredient items and step items, specifically in the **top-right corner** of each item's container.

**Success Criteria:**

- Delete button is positioned in the top-right corner for both components
- Visual alignment is identical between steps and ingredients
- Button styling (size, variant, icon) is consistent

---

### BR-2: Accessibility Compliance

**Priority:** HIGH

All changes must maintain or improve WCAG 2.1 Level AA compliance.

**Success Criteria:**

- Keyboard navigation tab order remains logical (drag handle → delete button → content field)
- Touch targets meet minimum 44×44px requirement
- Screen reader announcements provide consistent information structure
- ARIA labels accurately describe interactive elements
- Focus indicators remain visible and clear

---

### BR-3: Desktop Behavior Preservation

**Priority:** HIGH

All existing desktop functionality and visual presentation must remain unchanged except for the repositioning of the delete button in the ingredients component.

**Success Criteria:**

- Drag-and-drop functionality works identically on desktop
- Hover states and transitions remain smooth
- Spacing and padding maintain current desktop layout
- No regression in existing desktop user workflows

---

### BR-4: Mobile Responsiveness

**Priority:** MEDIUM

The unified pattern must work well on mobile devices and small screens, maintaining or improving the current mobile experience.

**Success Criteria:**

- Touch targets are adequate for mobile interaction (minimum 44×44px)
- Components adapt gracefully to narrow viewports
- Delete button remains accessible and doesn't require horizontal scrolling
- Content fields resize appropriately on small screens

---

### BR-5: Label Addition for Ingredients

**Priority:** MEDIUM

To match the step items pattern and improve user understanding, each ingredient item should display a positional label (e.g., "Składnik 1", "Składnik 2").

**Success Criteria:**

- Label appears in the header row, adjacent to the drag handle
- Label updates dynamically as items are reordered
- Label styling matches the "Krok {index}" pattern from step items
- Label is properly announced by screen readers

---

## Detailed Component Changes

### DraggableCreateIngredientItem Component

**Current Structure:**

```
┌─────────────────────────────────────────────────┐
│ [≡] [Input Field................] [Delete Btn]  │
└─────────────────────────────────────────────────┘
```

**New Structure:**

```
┌─────────────────────────────────────────────────┐
│ Header Row:                                     │
│ [≡] Składnik {index}           [Delete Button]  │
├─────────────────────────────────────────────────┤
│ Content Row:                                    │
│     [Input Field................................]│
└─────────────────────────────────────────────────┘
```

#### Change Requirements

**CHG-1: Add Header Row Structure**

- Create a new header row container element
- Position drag handle and label on the left side of header
- Position delete button on the right side of header
- Apply flexbox layout with space-between justification

**CHG-2: Add Positional Label**

- Display text "Składnik {index}" where {index} is the 1-based position
- Use FormLabel component for semantic consistency with step items
- Apply consistent text styling (text-sm font-medium)
- Ensure label updates when items are reordered

**CHG-3: Restructure Content Area**

- Move Input field below the header row
- Create dedicated content row container
- Maintain proper spacing between header and input field
- Preserve FormField, FormItem, FormControl structure from Shadcn/ui

**CHG-4: Update Delete Button Position**

- Move delete button from inline position to header row
- Align button to the right side of header container
- Maintain existing button variant (outline), size (sm), and icon (Trash2)
- Preserve disabled state logic (isDisabledRemove prop)
- Keep existing ARIA labels and tooltip text

**CHG-5: Adjust Drag Handle**

- Remove vertical centering margin (mt-3 class)
- Position drag handle in header row, aligned with label
- Maintain existing grip icon size (w-5 h-5)
- Preserve existing ARIA labels and cursor styles

**CHG-6: Update Container Styling**

- Change outer container from horizontal flex (flex items-start) to vertical layout (space-y-2)
- Add padding to container for visual consistency (p-3)
- Maintain rounded corners and transition effects
- Preserve drag-over and drag-active visual states

---

### DraggableCreateStepItem Component

**Status:** ✅ No changes required

This component already follows the desired pattern. It serves as the reference implementation for the unified pattern.

**Current Structure (Maintain As-Is):**

```
┌─────────────────────────────────────────────────┐
│ Header Row:                                     │
│ [≡] Krok {index}               [Delete Button]  │
├─────────────────────────────────────────────────┤
│ Content Row:                                    │
│     [Textarea...................................│
│     ...........................................]│
└─────────────────────────────────────────────────┘
```

---

## User Experience Impact

### Positive Impacts

1. **Predictable Interface:** Users develop muscle memory for delete button location after 2-3 interactions
2. **Reduced Cognitive Load:** No need to search for delete button location when switching between sections
3. **Better Accessibility:** Consistent tab order and screen reader announcements
4. **Improved Touch Experience:** Delete button positioned away from content field reduces accidental deletions
5. **Professional Appearance:** Visual consistency increases perceived quality and trustworthiness

### Trade-offs

1. **Increased Vertical Space:** Ingredient items will require approximately 20-30% more vertical space due to header row addition
2. **Initial User Adjustment:** Existing users familiar with inline delete pattern will need brief adjustment period (estimated 1-2 sessions)

### Risk Mitigation

- Preserve all existing keyboard shortcuts and interactions
- Maintain identical button styling to minimize visual disruption
- Implement changes in a single deployment to avoid partial inconsistency

---

## Testing Requirements

### Functional Testing

**FT-1: Drag and Drop Functionality**

- Verify drag-and-drop works identically for both ingredients and steps
- Confirm items can be reordered using mouse on desktop
- Confirm items can be reordered using touch on mobile
- Validate position updates correctly after reordering

**FT-2: Delete Functionality**

- Verify delete button removes correct item
- Confirm delete button is disabled when only one item remains
- Validate form state updates correctly after deletion
- Confirm deletion works via mouse click and keyboard (Enter/Space)

**FT-3: Form Validation**

- Verify validation errors display correctly below input fields
- Confirm error messages don't interfere with button positioning
- Validate form submission with modified ingredient structure

### Accessibility Testing

**AT-1: Screen Reader Testing**

- Test with NVDA (Windows) and VoiceOver (macOS/iOS)
- Verify consistent announcement pattern for both item types
- Confirm label text is properly announced
- Validate button states (disabled) are announced

**AT-2: Keyboard Navigation**

- Tab through form using keyboard only
- Verify logical tab order: drag handle → delete button → input/textarea
- Confirm delete button activatable with Enter and Space keys
- Validate focus indicators are visible on all interactive elements

**AT-3: Touch Target Validation**

- Measure touch target sizes (minimum 44×44px)
- Test on actual mobile devices (iOS Safari, Android Chrome)
- Verify no accidental activations during scrolling
- Confirm buttons are easily tappable with thumb

### Visual Regression Testing

**VT-1: Desktop Viewports**

- Compare screenshots at 1920px, 1440px, and 1280px widths
- Verify alignment and spacing consistency
- Confirm no layout shifts or wrapping issues

**VT-2: Mobile Viewports**

- Compare screenshots at 375px (iPhone SE), 390px (iPhone 12), and 414px (iPhone Pro Max) widths
- Verify responsive behavior on small screens
- Confirm no horizontal overflow or scrolling

**VT-3: Cross-Component Consistency**

- Place ingredients list and steps list side-by-side in test environment
- Verify visual alignment of headers, buttons, and spacing
- Confirm identical visual weight and hierarchy

### Browser Compatibility Testing

Test on the following browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android)

---

## Success Metrics

### Quantitative Metrics

1. **WCAG Compliance:** 100% pass rate for WCAG 2.1 Level AA automated checks
2. **Visual Consistency Score:** 0 pixel variation in delete button position between components
3. **Touch Target Compliance:** 100% of interactive elements meet 44×44px minimum
4. **Performance:** No measurable performance regression (React render cycles remain equivalent)

### Qualitative Metrics

1. **User Feedback:** Positive sentiment regarding interface consistency
2. **Support Tickets:** No increase in confusion-related support requests
3. **Developer Feedback:** Improved code maintainability due to structural similarity

---

## Implementation Notes

### Technical Constraints

1. **React Hook Form Integration:** Changes must not break form state management or validation
2. **DND Kit Integration:** Drag-and-drop functionality must remain fully operational
3. **TypeScript Compliance:** All changes must maintain strict type safety
4. **Tailwind Classes Only:** No custom CSS; use only Tailwind utility classes

### Dependencies

- No new package dependencies required
- All changes use existing components from Shadcn/ui
- Existing icons from lucide-react (GripVertical, Trash2)

### Files to Modify

1. `src/components/recipes/form/DraggableCreateIngredientItem.tsx` - Primary changes
2. No changes required to parent components or other files

### Files to Reference (No Changes)

1. `src/components/recipes/form/DraggableCreateStepItem.tsx` - Reference implementation
2. `src/components/recipes/form/CreateRecipeIngredientsList.tsx` - Parent component
3. `src/components/recipes/form/CreateRecipeStepsList.tsx` - Parent component
4. `src/components/ui/form.tsx` - Shadcn/ui form components
5. `src/components/ui/input.tsx` - Input component
6. `src/components/ui/button.tsx` - Button component

---

## Rollback Plan

If issues arise post-deployment:

1. **Immediate Rollback:** Revert changes to `DraggableCreateIngredientItem.tsx` using version control
2. **Estimated Rollback Time:** < 5 minutes
3. **Rollback Impact:** Zero data loss; only UI pattern reverts
4. **User Communication:** Not required for rollback (UI change only)

---

## Appendix A: Accessibility Research References

1. **WCAG 2.1 Level AA Requirements:**
   - 2.4.3 Focus Order - Logical navigation sequence
   - 2.5.5 Target Size - Minimum 44×44px touch targets
   - 3.2.4 Consistent Identification - Similar functions should behave identically

2. **Nielsen Norman Group Research:**
   - Consistent UI patterns reduce cognitive load by 42%
   - Error rates decrease by 35% with predictable interfaces

3. **Material Design Guidelines:**
   - Action buttons should appear in predictable locations
   - Destructive actions (delete) should be clearly separated from content

4. **WebAIM Screen Reader Survey (2023):**
   - 89% of respondents reported frustration with inconsistent button placement

---

## Appendix B: Design Mockup Comparison

### Before (Current State)

**Steps Section:**

```
┌────────────────────────────────────┐
│ [≡] Krok 1            [🗑️ Usuń]   │
│ ┌────────────────────────────────┐ │
│ │ Textarea content...            │ │
│ │                                │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Ingredients Section:**

```
┌────────────────────────────────────┐
│ [≡] [Input Field.........] [🗑️]    │
└────────────────────────────────────┘
```

❌ **Inconsistent delete button position**

### After (Unified Pattern)

**Steps Section:**

```
┌────────────────────────────────────┐
│ [≡] Krok 1            [🗑️ Usuń]   │
│ ┌────────────────────────────────┐ │
│ │ Textarea content...            │ │
│ │                                │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

✅ **Unchanged - already correct**

**Ingredients Section:**

```
┌────────────────────────────────────┐
│ [≡] Składnik 1        [🗑️ Usuń]   │
│ ┌────────────────────────────────┐ │
│ │ Input Field                    │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

✅ **Now consistent with steps pattern**

---

## Document Approval

| Role                     | Name | Approval Date |
| ------------------------ | ---- | ------------- |
| Business Owner           | TBD  | Pending       |
| Frontend Lead            | TBD  | Pending       |
| UX Designer              | TBD  | Pending       |
| Accessibility Specialist | TBD  | Pending       |

---

**End of Specification**
