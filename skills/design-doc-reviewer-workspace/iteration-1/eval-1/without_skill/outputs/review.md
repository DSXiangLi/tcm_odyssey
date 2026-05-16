# Design Document Review: DialogUI Scroll Style Design

**Document**: `docs/superpowers/specs/phase2.5/2026-05-11-dialogui-scroll-style-design.md`
**Reviewer**: Claude Code (without skill)
**Review Date**: 2026-05-15
**Review Type**: Completeness Assessment

---

## Executive Summary

The design document provides a **well-structured and mostly complete** specification for migrating DialogUI from a gray card style to a traditional Chinese scroll (卷轴) aesthetic. The document covers 8 core visual elements, implementation code snippets, and acceptance criteria. However, several critical gaps exist that could impact successful implementation.

**Overall Completeness Score**: 75/100

---

## 1. Completeness Assessment by Section

### 1.1 Design Background (Section 1) - COMPLETENESS: 90%

| Aspect | Status | Notes |
|--------|--------|-------|
| Problem Statement | Present | Clear identification of gray card style mismatch |
| Goals | Present | Three clear objectives defined |
| Reference Material | Present | `docs/ui/对话窗口/dialog-scroll.jsx` referenced |

**Gap Identified**: No screenshot or visual comparison between current implementation and target design. The document references the JSX design but doesn't include visual mockups for verification.

---

### 1.2 Overall Layout Design (Section 2) - COMPLETENESS: 85%

| Aspect | Status | Notes |
|--------|--------|-------|
| Size Parameters | Present | Width/Height/Position adjustments specified |
| Structure Layout | Present | ASCII diagram with pixel measurements |
| Component Heights | Present | Top/bottom scroll bars (24px), title (60px), options (80px), input (50px) |

**Gap Identified**: The ASCII layout diagram shows total height ~320px, but individual component heights sum to:
- Top scroll bar: 24px
- Title bar: 60px
- NPC avatar + mood + content: NOT EXPLICITLY DEFINED
- Options: 80px
- Input: 50px
- Bottom scroll bar: 24px

**Missing**: Explicit height allocation for the "dialog content area" where streaming text appears. This is critical for calculating scroll behavior.

---

### 1.3 Core Visual Elements (Section 3) - COMPLETENESS: 70%

#### Element-by-Element Assessment:

| Element | Code Provided | Similarity Est. | Gap Analysis |
|---------|--------------|-----------------|--------------|
| ScrollBar (3.1) | YES | 70% | No real wood grain texture - acceptable compromise |
| PaperBackground (3.2) | YES | 85% | Good gradient simulation |
| SealStamp (3.3) | YES | 80% | Rotation workaround documented |
| NPCAvatar (3.4) | YES | 90% | Circular style complete |
| MoodTag (3.5) | YES | 95% | Fully matches design |
| GoldBorder (3.6) | YES | 90% | Glow effect simulated |
| Vertical Text (3.7) | NO CODE | - | Simplified to horizontal - no implementation code |
| OptionCard (3.8) | NO CODE | - | Only interface defined, no implementation |

**Critical Gaps**:

1. **Element 3.7 (Vertical Text)**: The design acknowledges Phaser limitation but provides NO concrete implementation code. The placeholder comment `// 与心情标签类似` is insufficient for implementation.

2. **Element 3.8 (OptionCard)**: Only interface `DialogOption` and function signature provided. Missing:
   - Hover effect implementation
   - Click handler binding
   - Option selection callback mechanism
   - Dynamic option rendering from NPC response

3. **Missing Element**: The original JSX design (`dialog-scroll.jsx`) includes:
   - Narration messages (italic centered text)
   - System messages (unlock notifications)
   - Rich text parsing for `[[classic:xxx]]`, `[[herb:xxx]]` links

   These are mentioned in Section 5.2 "Rich text highlight" but NOT detailed in Section 3.

---

### 1.4 Color Scheme (Section 4) - COMPLETENESS: 95%

| Aspect | Status | Notes |
|--------|--------|-------|
| New Constants | Present | `SCROLL_COLORS` with 15 color values |
| Color Categories | Present | Ink, Vermilion, Paper, Wood, Gold, Shadow |
| File Location | Present | `src/data/ui-color-theme.ts` |

**Minor Gap**: The document doesn't specify whether to use CSS variables (like the JSX) or Phaser number constants. The code snippets use number constants, which is correct for Phaser Graphics, but could cause confusion.

---

### 1.5 Functional Changes (Section 5) - COMPLETENESS: 60%

#### 5.1 Retained Functions - Adequate
| Function | Documented | Risk |
|----------|-----------|------|
| Streaming text | YES | Font style change - needs implementation detail |
| Input box | YES | DOM input style change - needs CSS spec |
| Stop button | YES | "Stop writing" label style - no code |
| Tool callbacks | YES | No change - OK |
| NPC sprite | YES | Overlay circular frame - needs positioning |

#### 5.2 New Functions - CRITICAL GAPS

| Function | Documented | Implementation Code |
|----------|-----------|-------------------|
| History scrolling | Mentioned | NO - Critical missing implementation |
| Option cards | Mentioned | NO - Only interface, no logic |
| Rich text highlight | Mentioned | NO - Parsing logic missing |
| System messages | Mentioned | NO - Style definition missing |

**Critical Missing Details**:

1. **Scroll Implementation**: The document says "content exceeds length can scroll" but provides NO implementation for:
   - How to determine content overflow
   - Scroll container setup in Phaser
   - Scroll event handling
   - Scroll position reset on new message

2. **Rich Text Parsing**: The JSX design uses `parseRich()` function to parse `[[classic:xxx]]`, `[[herb:xxx]]`, `[[symptom:xxx]]` patterns. The design document mentions this but provides NO parsing implementation.

3. **Option Cards Interaction**: Missing:
   - How options are populated from NPC response
   - Click → send message flow
   - Option visibility toggle logic

---

### 1.6 File Modification Scope (Section 6) - COMPLETENESS: 50%

| Aspect | Status | Notes |
|--------|--------|-------|
| Modified Files Listed | YES | Only 2 files |
| Change Scope | Minimal | Too minimal for actual scope |

**Critical Gap**: The document only lists 2 files to modify:
- `src/ui/DialogUI.ts`
- `src/data/ui-color-theme.ts`

**Missing Files**:
- New component for scroll container/clipping mask
- Rich text parsing utility (`src/utils/richTextParser.ts`)
- Option card component (`src/ui/components/OptionCard.ts`)
- CSS file for DOM input styling (if applicable)

---

### 1.7 Implementation Priority (Section 7) - COMPLETENESS: 80%

| Aspect | Status | Notes |
|--------|--------|-------|
| Priority Order | Present | P1-P8 sequencing |
| Complexity Estimation | Present | Low/Medium labels |
| Dependencies | Partial | Implicit but not explicit |

**Gap**: No explicit dependency graph. For example:
- P6 (Option cards) depends on P3 (NPC avatar + mood) for consistent styling
- P7 (Scroll) depends on P1 (Background) for container setup

---

### 1.8 Acceptance Criteria (Section 8) - COMPLETENESS: 70%

| Criterion | Status | Notes |
|-----------|--------|-------|
| Visual similarity 70%+ | Present | Subjective - needs objective measure |
| All existing functions work | Present | Good functional regression check |
| E2E tests 19/19 pass | Present | Good reference to existing tests |
| No regression on other UI | Present | Good scope boundary |

**Missing Criteria**:
- No unit test requirements for new components
- No visual comparison baseline/screenshot
- No performance criteria (FPS impact of scroll rendering)
- No accessibility criteria (contrast ratios for new colors)

---

## 2. Cross-Reference Validation

### 2.1 Alignment with Existing Code

**DialogUI.ts Current State**:
- Width: 600px → Design: 480px (resize needed)
- Height: 200px → Design: 320px (resize needed)
- Background: Graphics gradient (gray-blue) → Design: Scroll style
- Input: DOM element with inline CSS → Design: Styled input with paper background

**ui-color-theme.ts Current State**:
- Contains `BORDER_GLOW: 0xc0a080` which matches design's `GOLD_BORDER`
- Missing all `SCROLL_COLORS` constants - needs addition

**npc-dialog.spec.ts Tests**:
- 19 tests covering: Smoke, Trigger, Dialog Flow, Tool Call, Quality
- Tests verify functional behavior, NOT visual appearance
- No visual regression tests exist

### 2.2 Alignment with Original JSX Design

| JSX Feature | Design Doc Coverage | Gap |
|-------------|-------------------|-----|
| ScrollBar wood texture | 70% sim. | No real texture |
| Paper background | 85% sim. | No noise texture |
| Seal stamp | 80% sim. | Rotation workaround |
| NPC circular avatar | 90% sim. | Good |
| Mood tag | 95% sim. | Good |
| Vertical text label | Simplified | No code for horizontal alternative |
| Option cards | Interface only | No hover/click logic |
| Rich text parsing | Mentioned | NO implementation |
| Narration style | NOT covered | Missing |
| System message style | Mentioned | No implementation |
| Scroll behavior | Mentioned | NO implementation |

---

## 3. Risk Assessment

### HIGH RISK (Must Address Before Implementation)

1. **Scroll Implementation Missing**: Phaser doesn't natively support scroll containers like HTML. The design assumes scrolling but provides no implementation for:
   - Content clipping mask
   - Scroll position tracking
   - Touch/mouse scroll handling

   **Recommendation**: Either use Phaser's DOM container with CSS overflow, or implement manual scroll with Graphics clipping.

2. **Rich Text Parsing Missing**: The original design has sophisticated rich text with clickable links. The design document mentions `[[classic:xxx]]` syntax but provides NO parsing implementation.

   **Recommendation**: Create `src/utils/richTextParser.ts` with regex parsing before implementing.

3. **Option Cards Interaction Missing**: Options are a key feature but only interface is defined. Missing click handlers, option population from NPC, and selection feedback.

   **Recommendation**: Define OptionCard component with full interaction logic.

### MEDIUM RISK (Should Address)

4. **Vertical Text Simplification**: The design acknowledges Phaser limitation but provides no concrete alternative implementation. The placeholder comment is insufficient.

   **Recommendation**: Provide complete code for horizontal label with styling differentiation.

5. **New Function Scope Underestimated**: Document lists only 2 files to modify, but scroll, rich text, and options likely require new utility files.

   **Recommendation**: Expand file modification scope to include new components.

### LOW RISK (Nice to Have)

6. **No Visual Mockup**: The document references JSX design but doesn't include visual comparison.

   **Recommendation**: Add screenshot mockup or visual diff for verification.

7. **No Performance Criteria**: Scroll rendering may impact FPS.

   **Recommendation**: Add performance benchmark (e.g., FPS > 55 during scroll).

---

## 4. Completeness Checklist

### Required Elements (Must Be Present)

- [x] Problem statement
- [x] Goals/objectives
- [x] Reference material
- [x] Size parameters
- [x] Structure layout diagram
- [x] Color scheme
- [x] Implementation priority
- [x] Acceptance criteria

### Implementation Details (Should Be Complete)

- [x] ScrollBar code (70% similarity acknowledged)
- [x] PaperBackground code
- [x] SealStamp code
- [x] NPCAvatar code
- [x] MoodTag code
- [x] GoldBorder code
- [ ] **Vertical Text code - MISSING**
- [ ] **OptionCard implementation code - MISSING**
- [ ] **Scroll behavior code - MISSING**
- [ ] **Rich text parsing code - MISSING**
- [ ] **Narration style code - MISSING**
- [ ] **System message style code - MISSING**

### Integration Details (Should Be Defined)

- [x] API extension (DialogUIConfig)
- [x] File modification scope (partial)
- [ ] **Event handling for new features - MISSING**
- [ ] **Component interaction flow - MISSING**
- [ ] **Data flow for options - MISSING**

---

## 5. Recommendations

### Before Implementation

1. **Add Missing Implementation Code**: Complete code for elements 3.7, 3.8, and add new sections for scroll, rich text, narration/system message styles.

2. **Expand File Modification Scope**: Add:
   - `src/utils/richTextParser.ts` (new)
   - `src/ui/components/OptionCard.ts` (new)
   - `src/ui/components/ScrollContainer.ts` (new, if not using DOM)

3. **Define Explicit Heights**: Calculate and document exact height allocation for content area:
   ```
   Content Area Height = 320 - 24(top) - 60(title) - 80(options) - 50(input) - 24(bottom) = 82px
   ```
   This is insufficient for multi-line streaming text. Design needs adjustment.

4. **Add Visual Mockup**: Include screenshot comparison or visual diff for acceptance verification.

5. **Add Unit Test Requirements**: Define unit tests for new components (richTextParser, OptionCard).

### During Implementation

1. Start with P1-P4 visual elements (background, borders, avatar)
2. Validate each element against JSX design visually
3. Implement scroll before options (P7 before P6)
4. Implement rich text parsing before content rendering

---

## 6. Final Assessment

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Problem Definition | 9 | 10 | Clear but lacks visual comparison |
| Layout Specification | 8 | 10 | Good ASCII diagram, missing content area height |
| Visual Elements | 7 | 10 | 6/8 elements have code, 2 missing |
| Color Scheme | 9 | 10 | Comprehensive color constants |
| Functional Changes | 6 | 10 | New features mentioned but not implemented |
| File Scope | 5 | 10 | Underestimated modification scope |
| Implementation Priority | 8 | 10 | Good sequencing, missing dependencies |
| Acceptance Criteria | 7 | 10 | Good functional criteria, missing visual/perf |
| **TOTAL** | **75** | **100** | |

---

## Conclusion

The design document is **well-structured and provides good foundation** for implementation, but has **critical gaps in implementation code for new features** (scroll, options, rich text). These gaps represent approximately 25% of the implementation effort and should be addressed before starting development.

**Recommendation**: Update design document with missing implementation sections before proceeding to implementation phase.