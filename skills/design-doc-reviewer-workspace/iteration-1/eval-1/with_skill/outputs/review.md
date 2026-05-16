# Design Document Review: docs/superpowers/specs/phase2.5/2026-05-11-dialogui-scroll-style-design.md

## Overall Assessment
- **Completeness**: 6/8 dimensions complete
- **Clarity**: Medium
- **Actionability**: Needs Revision

## Dimension Analysis

| Dimension | Status | Notes |
|-----------|--------|-------|
| Background | ✅ | Clearly explains visual mismatch problem and design reference |
| Problem Definition | ✅ | Specific pain point: grey card style vs Chinese ancient scroll theme |
| Solution | ⚠️ | Code snippets provided but missing integration details |
| Boundaries | ⚠️ | Mentions what's preserved but unclear about what's deferred |
| Integration | ❌ | No migration plan from existing DialogUI.ts to new implementation |
| Expected Outcome | ⚠️ | 70% similarity mentioned but lacks user-facing outcome description |
| Validation Scope | ⚠️ | Only mentions E2E test pass, missing visual validation method |
| Acceptance Criteria | ✅ | 4 criteria with test pass rate specified |

---

## Critical Issues Found

### Omissions

1. **Issue**: Missing migration/transition plan from existing implementation
   **Location**: Section 6 (File Modification Range)
   **Risk**: Current DialogUI.ts has 422 lines with complex state management (SSEClient, input handling, tool callbacks, global exposure). The design only mentions "full visual improvement" without explaining how to preserve these critical functions during refactoring.
   **Recommendation**: Add a new section "Migration Strategy" with:
   - Step-by-step approach: First add new visual functions (createScrollBar, createPaperBackground), then refactor existing components, finally replace background
   - List of functions that MUST NOT change: sendMessage, sendMessageWithTools, onChunk, onComplete, onError, stopGeneration, handleSend
   - Risk mitigation: Keep existing global exposure (__DIALOG_UI__) intact for E2E tests

2. **Issue**: Missing detailed specification for "对话历史滚动" feature
   **Location**: Section 5.2 (New Features)
   **Risk**: Current DialogUI.ts only displays single response via `contentText.setText(this.currentText)`. The design proposes scrollable history but provides no implementation details. This is a significant functional change, not just visual.
   **Recommendation**: Add implementation details:
   - Data structure: How to store multiple message rounds (array of {role, text, timestamp}?)
   - UI component: Graphics scrollable container vs DOM scrollable div
   - Scroll behavior: Auto-scroll to bottom on new message, scroll position preservation
   - Memory limit: Maximum history entries before truncation

3. **Issue**: Missing error handling strategy for new visual components
   **Location**: Section 3 (Core Visual Elements)
   **Risk**: Graphics drawing functions (createScrollBar, createPaperBackground) have no fallback if Phaser.Graphics fails or rendering issues occur. Current implementation has error handling in onError() but no visual error states.
   **Recommendation**: Define fallback behavior:
   - If gradient fails, use solid color fallback
   - If container exceeds memory, simplify decorations
   - Add visual error indicator (e.g., red border) if rendering fails

### Ambiguities

1. **Issue**: "8个视觉元素中的关键要素完整还原" is vague
   **Location**: Section 1.2 (Improvement Goals)
   **Risk**: What exactly are "关键要素"? The design lists 8 elements but similarity estimates range from 70%-95%. Which ones are "关键" and must reach 90%+?
   **Recommendation**: Define priority tiers:
   - Tier 1 (Must achieve 85%+): 宣纸背景, NPC头像, 心情标签, 输入区
   - Tier 2 (Target 75%+): 木轴装饰, 印章, 金棕色边框
   - Tier 3 (Acceptable simplification): 竖排文字标签

2. **Issue**: "整体风格与原卷轴设计70%+相似" lacks measurement method
   **Location**: Section 8 (Acceptance Criteria #1)
   **Risk**: How will 70% similarity be measured? Subjective judgment by whom? No quantitative metrics provided.
   **Recommendation**: Define measurable criteria:
   - Color match: All 8 SCROLL_COLORS values match design spec (exact hex codes)
   - Layout match: All dimensions match spec table (width 480px, height 320px, Y offset -60px)
   - Visual comparison: Side-by-side screenshot comparison with dialog-scroll.jsx reference
   - User feedback: Optional user survey rating (if feasible)

3. **Issue**: "选项卡片 (OptionCard)" implementation incomplete
   **Location**: Section 3.8 (OptionCard)
   **Risk**: Code snippet shows interface but function body is empty. Hover effect mentioned but no specifics. Click handler not defined. How does clicking an option trigger sendMessage?
   **Recommendation**: Complete the implementation:
   ```typescript
   function createOptionCards(scene: Phaser.Scene, options: DialogOption[], onSelect: (opt: DialogOption) => void): Container[] {
     // Full implementation with:
     // - Click handler calling onSelect callback
     // - Hover state colors (background: 0xB3322A with 0.06 alpha)
     // - Active state after click
   }
   ```

### Contradictions

1. **Issue**: Size discrepancy between design spec and reference implementation
   **Location**: Section 2.1 (Size Adjustment) vs dialog-scroll.jsx
   **Risk**: Design spec says width 480px, height 320px. Reference dialog-scroll.jsx shows width 460px, height 760px. Which one should be implemented?
   **Recommendation**: Clarify the source of 480×320 dimensions. Is this a scaled-down version for the 800×600 game window? Add explicit calculation showing how 460×760 was scaled to 480×320.

2. **Issue**: "竖排文字标签（简化）" contradicts reference design's vertical text
   **Location**: Section 3.7 (Simplified Vertical Text) vs dialog-scroll.jsx lines 217-225
   **Risk**: Reference design uses `writing-mode: vertical-rl` for "学生" label. Design says "Phaser不支持竖排文字" and proposes horizontal simplification. This is a significant visual difference from reference, but no similarity estimate is provided for this element.
   **Recommendation**: Either:
   - Add similarity estimate for simplified horizontal label (likely 50%)
   - Or explore alternative: Pre-rendered rotated text texture, or use Phaser DOM element for this specific label

### Clarification Needed

1. **Issue**: API extension adds `mood`, `title`, `options` but no data source specified
   **Location**: Section 5.3 (API Extension)
   **Risk**: Where do these new fields come from? NPC data files? Backend Hermes response? Current NPC config only has npcId, npcName, npcSpriteKey.
   **Recommendation**: Specify data source:
   - `mood`: From Hermes backend response (new field in SSE stream?)
   - `title`: From NPC config file (update `src/data/npcs.ts`?)
   - `options`: Dynamically generated based on conversation context (LLM output?)

2. **Issue**: "富文本高亮 [[classic:xxx]] 显示为红色（暂不实现点击）"
   **Location**: Section 5.2 (New Features)
   **Risk**: Current DialogUI.ts has no rich text parsing. This requires significant parsing logic. "暂不实现点击" means it's a display-only feature, but the parsing complexity is not acknowledged.
   **Recommendation**: Clarify scope:
   - Is rich text parsing part of this design or deferred to Phase 3?
   - If included, add parsing function spec (regex pattern, color mapping)
   - Estimate complexity: Low (just regex + color change) or Medium (needs state management)

---

## Recommendations

### Must Fix Before Implementation

1. **Add Migration Strategy Section**
   - Define which existing functions must remain unchanged
   - List step-by-step visual refactoring order (P1-P8 is implementation order, need migration order)
   - Specify how to preserve E2E test compatibility (__DIALOG_UI__ global exposure)

2. **Define Measurable Visual Similarity Criteria**
   - Replace subjective "70%相似" with concrete checklist:
     - [ ] All SCROLL_COLORS match design hex codes
     - [ ] All dimensions match spec table
     - [ ] Screenshot comparison approved by stakeholder
   - Add visual validation method (who approves, when)

3. **Complete Scrollable History Implementation Spec**
   - Define message history data structure
   - Specify scroll container implementation (Phaser vs DOM)
   - Add scroll behavior rules (auto-scroll, max entries)

### Should Fix (Recommended)

1. **Clarify Data Source for New Config Fields**
   - Document where `mood`, `title`, `options` come from
   - Update NPC config files if needed

2. **Resolve Size Discrepancy**
   - Explain how 460×760 reference was scaled to 480×320
   - Or use reference dimensions if that's the intended design

3. **Complete OptionCard Implementation**
   - Add click handler spec
   - Define hover colors explicitly
   - Show integration with sendMessage()

### Optional Improvements

1. **Add Visual Fallback Strategy**
   - Define fallback colors/styles if Graphics rendering fails
   - Add error state visual indicator

2. **Consider DOM Element for Vertical Text**
   - Instead of simplifying to horizontal, use Phaser DOM for "学生" label
   - This would achieve higher visual similarity with reference

---

## Clarification Questions

The following questions require user input before implementation can proceed:

1. **Size Clarification**: The design spec proposes 480×320 dialog size, but the reference dialog-scroll.jsx uses 460×760. Was 480×320 calculated for the 800×600 game window? Please confirm the intended dimensions and scaling logic.

2. **Data Source for New Fields**: The API extension adds `mood`, `title`, `options` fields. Where should these come from?
   - Option A: Backend Hermes response (requires backend update)
   - Option B: Static NPC config files (requires `src/data/npcs.ts` update)
   - Option C: Dynamically generated by frontend logic

3. **Scrollable History Scope**: Is "对话历史滚动" a full multi-round history feature, or just scrollable display for single long response? The reference shows 5-message history, but current implementation only shows one response.

4. **Rich Text Scope**: Should [[classic:xxx]] highlighting be implemented in this phase, or deferred? If included, is it just regex color change, or needs more complex parsing?

---

## Final Verdict

- **Status**: **Needs Revision**

**Reasoning**:
The design document has clear background and problem definition, and provides good visual element implementation snippets. However, critical gaps exist:

1. **Integration Gap**: No migration plan from existing 422-line DialogUI.ts with complex state management
2. **Ambiguous Acceptance**: "70% similarity" lacks measurable criteria
3. **Scope Uncertainty**: New features (scrollable history, rich text) have incomplete specs
4. **Data Source Missing**: New config fields lack origin specification

The design is **not ready for implementation** until:
- Migration strategy is added
- Measurable visual criteria are defined
- Scrollable history implementation is detailed
- Clarification questions are answered

**Estimated Revision Effort**: 2-4 hours to add missing sections and clarify ambiguities.

---

## Appendix: Cross-Reference Analysis

### Alignment with Project Context

| Check | Result | Notes |
|-------|--------|-------|
| Phaser 3 architecture | ✅ | Uses Graphics API correctly |
| TypeScript patterns | ✅ | Type interfaces defined |
| Directory structure | ✅ | Correct phase2.5 path |
| Naming convention | ✅ | Correct date format (2026-05-11) |
| E2E test reference | ✅ | Correctly references npc-dialog.spec.ts |

### Potential Conflicts with Existing Code

| Conflict | Severity | Description |
|----------|----------|-------------|
| Global exposure change | HIGH | Design doesn't specify preserving __DIALOG_UI__ format used by E2E tests |
| Input handling change | MEDIUM | New input style may affect handleSend() timing tests |
| Layout constants change | HIGH | dialogWidth/dialogHeight changes from 600×200 to 480×320, affects all positioning |

---

*Review completed following design-doc-reviewer skill methodology*
*Review date: 2026-05-15*
*Reviewer: Claude Code Agent*