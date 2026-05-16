# Design Document Review: Dialog UI HTML Embedding Design

**Document**: `docs/superpowers/specs/phase2.5/2026-05-14-dialog-ui-html-embedding-design.md`
**Reviewer**: Claude (Design Review Agent)
**Date**: 2026-05-15
**Status**: APPROVED with RECOMMENDATIONS

---

## Executive Summary

This design document proposes migrating the existing Phaser-based `DialogUI.ts` to a React-based HTML embedding solution (`DialogUI.tsx`), following the established pattern used for Inventory, Decoction, and Diagnosis UIs. The document is well-structured, comprehensive, and aligns with existing architectural patterns in the codebase.

**Overall Rating**: 8.5/10

**Approval Status**: APPROVED for implementation, with minor recommendations addressed before or during implementation.

---

## Document Structure Analysis

### Strengths

1. **Clear Problem Definition**: Section 1 clearly articulates current state, existing capabilities, and deficiencies. The table format makes it easy to understand what needs to change.

2. **Well-Defined Boundaries**: Section 2 explicitly lists what is included and excluded from this phase, preventing scope creep.

3. **Comprehensive Architecture Diagram**: Section 3.1 provides a clear visual representation of the system integration, showing data flow between Phaser and React layers.

4. **Pattern Consistency Verification**: Section 3.2 explicitly compares with existing HTML UI implementations, demonstrating adherence to established patterns.

5. **Concrete Verification Criteria**: Section 5 provides specific acceptance criteria with test methods and pass conditions.

### Minor Issues

1. **Missing File Structure Table**: The document does not include a concrete file creation/modification list (e.g., which files will be created, which will be deprecated).

2. **No Timeline Estimates**: While not critical for design docs, rough implementation time estimates would help with planning.

---

## Technical Feasibility Assessment

### Verified Consistency with Existing Patterns

| Aspect | Design Proposal | Existing Pattern | Match |
|--------|-----------------|------------------|-------|
| Entry file naming | `dialog-entry.tsx` | `*-entry.tsx` | YES |
| Component naming | `DialogUI.tsx` | `*UI.tsx` | YES |
| CSS file naming | `dialog.css` | `*.css` | YES |
| Bridge file naming | `dialog-events.ts` | `*-events.ts` | YES |
| Mounting approach | `createRoot(document.body)` | Same in inventory-entry.tsx | YES |
| Cleanup pattern | `unmount() + removeChild` | Same in inventory-entry.tsx | YES |

**Assessment**: The proposed architecture follows all established patterns in the codebase.

### Component Complexity Assessment

**Source Files Reviewed**:
- `/home/lixiang/Desktop/zhongyi_game_v3/src/ui/DialogUI.ts` (422 lines)
- `/home/lixiang/Desktop/zhongyi_game_v3/docs/ui/对话窗口/dialog-scroll.jsx` (349 lines)
- `/home/lixiang/Desktop/zhongyi_game_v3/docs/ui/对话窗口/rich-text.jsx` (105 lines)

**Migration Complexity**: MEDIUM

**Reasons**:
1. The existing `DialogUI.ts` is a Phaser GameObject Container with SSE integration - migration to React requires careful handling of SSE flow.
2. Rich text parsing logic (`parseRich` function) needs TypeScript conversion.
3. Tool Call bridge pattern is critical - current implementation passes callback through config; needs careful event-based replacement.
4. Global state exposure (`__DIALOG_UI__`, `__DIALOG_ACTIVE__`) needs equivalent in React for E2E testing.

---

## Completeness Check

### Included and Addressed

| Item | Section Reference | Status |
|------|-------------------|--------|
| React component migration | Section 2.1 | SPECIFIED |
| Rich text system | Section 2.1, 4.1 | SPECIFIED |
| Ancient style CSS | Section 2.1, 4.1 | SPECIFIED |
| Dialog history storage | Section 2.1, 3.3 | SPECIFIED |
| SSE stream handling | Section 3.3 | SPECIFIED |
| Tool Call bridge | Section 3.3 | SPECIFIED |
| Scene integration | Section 2.1 | SPECIFIED |
| Acceptance criteria | Section 5 | SPECIFIED |
| Risk assessment | Section 6 | SPECIFIED |
| Reference docs | Section 7 | SPECIFIED |

### Not Explicitly Addressed (Recommendations)

| Item | Importance | Recommendation |
|------|------------|----------------|
| TCM_DATA TypeScript types | MEDIUM | Define TypeScript interfaces for herb/acupoint/classic/symptom data structures |
| TCM_DATA location | MEDIUM | Specify where `TCM_DATA` will be stored (separate file or in component) |
| SSEClient singleton vs new instance | LOW | Current DialogUI creates new SSEClient; clarify if this pattern continues |
| Error handling UI | MEDIUM | Specify how errors will be displayed in the ancient style UI |
| Loading states | MEDIUM | Specify how "正在思考..." will be styled in ancient theme |
| Keyboard focus management | LOW | Section 6 mentions React/Phaser focus conflict but no solution specified |

---

## Design Prototype Quality Assessment

**Files in `docs/ui/对话窗口/`**:
- `dialog-scroll.jsx` - 349 lines, well-structured React component
- `rich-text.jsx` - 105 lines, reusable rich text parser
- `styles.css` - Ancient theme styling
- `中医古风对话框.html` - HTML prototype

**Assessment**: The design prototypes are production-ready quality:
1. Clean separation of concerns (RichText as reusable component)
2. Proper use of CSS variables for theme consistency
3. Good accessibility considerations (hover tooltips)
4. Clean parsing logic for `[[type:term]]` markup

---

## Risk Assessment Review

### Design Document Risks (Section 6)

| Risk | Severity (Doc) | My Assessment | Notes |
|------|----------------|---------------|-------|
| SSE stream handling position change | Medium | AGREED | React layer calling SSEClient is correct approach |
| Test selector change | Medium | AGREED | Will need E2E test updates for new selectors |
| Dialog history loss | Low | AGREED | GameStateBridge storage is appropriate |
| Tool Call delay | Low | AGREED | EventBus is standard pattern, <10ms is realistic |
| React/Phaser focus conflict | Medium | AGREED | But needs explicit solution in implementation |

### Additional Risks Not Mentioned

| Risk | Severity | Mitigation |
|------|----------|------------|
| Memory leak from unremoved event listeners | Medium | Ensure cleanup in `hideDialogUI()` removes all EventBus listeners |
| TCM_DATA size growth | Low | Consider lazy loading or async data fetching for large datasets |
| Unicode rendering in ancient fonts | Low | Test `Noto Serif SC` and `Ma Shan Zheng` rendering for all TCM terms |

---

## Acceptance Criteria Review

### Functional Criteria (Section 5.1)

| Criterion | Test Method | Assessment |
|-----------|-------------|------------|
| Dialog UI display | E2E: NPC-S01 | Valid - `.dialog-scroll` selector matches prototype |
| NPC info correct | E2E: NPC-S02 | Valid - `.dialog-title` pattern exists in prototype |
| User input | E2E: NPC-D01 | Valid - input element exists in prototype |
| Stream response | E2E: NPC-D03 | Valid - but needs SSE integration test |
| Stop generation | E2E: NPC-D04 | Valid - stop button needs CSS styling |
| Tool Call trigger | E2E: NPC-TC01 | Valid - event-based bridge test |
| Dialog history retention | E2E: New test | Needs new test creation |

### Visual Criteria (Section 5.2)

All criteria are comparison-based, which is appropriate for UI migration.

### Architecture Criteria (Section 5.3)

All criteria are pattern-consistency checks, which aligns with existing codebase patterns.

### Test Coverage (Section 5.4)

- E2E tests: 19/19 through - reasonable target
- TypeScript: No compilation errors - standard requirement
- Build: No runtime errors - standard requirement

---

## Implementation Recommendations

### Before Implementation

1. **Create File Creation Checklist**:
   ```
   Files to create:
   - src/ui/html/dialog-entry.tsx
   - src/ui/html/DialogUI.tsx
   - src/ui/html/dialog.css
   - src/ui/html/dialog-events.ts
   - src/ui/html/rich-text.ts (or .tsx)
   - src/data/tcm-data.ts (TypeScript types + data)

   Files to deprecate:
   - src/ui/DialogUI.ts (keep for reference initially, remove after migration)
   ```

2. **Define TypeScript Interfaces**:
   ```typescript
   interface TCMHerbData {
     pinyin: string;
     tag: string;
     meta: Record<string, string>;
     body: string;
   }
   // Similar for acupoint, classic, symptom
   ```

3. **Specify Error/L Loading States**: Define CSS classes for:
   - `.dialog-loading` - "正在思考..." state
   - `.dialog-error` - Error message display

### During Implementation

1. **Incremental Migration**: Start with basic UI display, then add:
   - SSE stream handling
   - Rich text rendering
   - Tool Call bridge
   - Dialog history

2. **Test Migration**: Update E2E selectors progressively, not all at once.

3. **Keyboard Focus Solution**: Add explicit handling:
   ```typescript
   // In dialog-entry.tsx
   const handleFocus = () => {
     // Disable Phaser keyboard input
     EventBus.emit(DIALOG_EVENTS.INPUT_FOCUS);
   };
   const handleBlur = () => {
     // Re-enable Phaser keyboard input
     EventBus.emit(DIALOG_EVENTS.INPUT_BLUR);
   };
   ```

---

## Final Verdict

### Approval: APPROVED

The design document is comprehensive, well-structured, and follows established patterns. The proposed migration from Phaser-based DialogUI to React-based DialogUI.tsx is technically sound and aligns with the codebase's architectural direction.

### Required Actions Before Implementation

1. None critical - proceed with implementation.

### Recommended Actions (Optional)

1. Add explicit file creation/modification list
2. Define TypeScript interfaces for TCM_DATA
3. Specify error/loading state styling
4. Add explicit keyboard focus management solution

### Confidence Level

**HIGH** - The design is well-grounded in existing patterns and has comprehensive acceptance criteria. The migration should proceed smoothly following the established entry/component/CSS/bridge pattern.

---

## Appendix: Pattern Reference Summary

### Entry File Pattern (from inventory-entry.tsx)

```typescript
// Standard pattern:
// 1. Create container div with unique ID
// 2. Append to document.body
// 3. Create React root
// 4. Render component
// 5. Return cleanup function (unmount + removeChild)

export function createXxxUI(options): () => void {
  const container = document.createElement('div');
  container.id = 'xxx-ui-root';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<XxxUI {...options} />);

  return () => {
    root.unmount();
    document.body.removeChild(container);
  };
}
```

### Component Pattern (from dialog-scroll.jsx)

- Use CSS variables for theme consistency
- RichText as separate reusable component
- Parse function for `[[type:term]]` markup
- History state with auto-scroll
- Input handling with Enter key support

### Bridge Pattern (from existing events.ts files)

- Named exports for event constants
- EventBus.emit for Phaser→React
- EventBus.on for React→Phaser
- Cleanup in hide function