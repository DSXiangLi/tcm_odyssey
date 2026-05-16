# Design Document Review: docs/superpowers/specs/phase2.5/2026-05-14-dialog-ui-html-embedding-design.md

## Overall Assessment
- **Completeness**: 7.5/8 dimensions complete (Boundaries dimension has minor gaps)
- **Clarity**: High - Architecture diagrams, tables, and code flow clearly presented
- **Actionability**: Needs Revision - Several implementation details require clarification

---

## Dimension Analysis

| Dimension | Status | Notes |
|-----------|--------|-------|
| Background | ✅ | Clear problem statement with current defects list and existing design docs reference |
| Problem Definition | ✅ | Core question explicitly stated: "How to migrate high-quality UI from design docs to game system?" |
| Solution | ✅ | Architecture diagram provided, component migration plan clear, technical stack specified |
| Boundaries | ⚠️ | IN/OUT scope defined but migration transition plan missing; what happens to existing DialogUI.ts? |
| Integration | ✅ | Consistency table with existing HTML UI patterns (inventory/decoction/diagnosis); data flow documented |
| Expected Outcome | ✅ | Visual, functional, and interaction effects all described with examples |
| Validation Scope | ✅ | E2E tests specified with pass conditions; visual/architecture validation methods listed |
| Acceptance Criteria | ✅ | Measurable criteria: 19/19 E2E tests pass, TypeScript no errors, no runtime errors |

---

## Critical Issues Found

### Omissions (遗漏点)

1. **Migration Transition Plan Missing**
   - **Issue**: Document describes "React component migration" but does not specify how existing `DialogUI.ts` (Phaser-based) will be deprecated or co-exist during transition.
   - **Location**: Section 2.1 (本次包含) and Section 3.1 (架构图)
   - **Risk**: During migration, two DialogUI systems could conflict; tests reference `__DIALOG_UI__` which is set by current Phaser implementation. Without transition plan, E2E tests may fail during migration window.
   - **Recommendation**: Add a "Migration Strategy" subsection specifying:
     - Phase 1: Keep both systems, tests target whichever is active
     - Phase 2: Deprecate DialogUI.ts after DialogUI.tsx passes all tests
     - Define `__DIALOG_UI__` global state contract for test compatibility

2. **Error Handling Not Specified**
   - **Issue**: No mention of how React UI handles SSE connection failures, Hermes backend unavailability, or partial tool call failures.
   - **Location**: Section 3.3 (数据流向) and Section 4 (实现后效果)
   - **Risk**: User experience degradation when network issues occur; no guidance for implementing error states in React.
   - **Recommendation**: Add error handling specification:
     - SSE connection timeout behavior (retry? show error message?)
     - Hermes backend down: what UI state to display
     - Tool call failure: how to handle and notify user

3. **TCM_DATA Source Unclear**
   - **Issue**: Document mentions "rich-text.jsx + TCM_DATA" but TCM_DATA in design prototype (`docs/ui/对话窗口/rich-text.jsx`) is a demo stub with only 5 herbs, 4 acupoints.
   - **Location**: Section 2.1 (本次包含) - "富文本系统" row
   - **Risk**: Production requires comprehensive TCM data. Current demo data insufficient for full game. Migration may break if TCM_DATA structure differs.
   - **Recommendation**: Specify:
     - Will TCM_DATA be migrated as-is (demo) or expanded?
     - Where will production TCM data come from? (GameStateBridge? Backend API?)
     - Data schema contract between React UI and data source

4. **NPC Mood/Title Data Source Missing**
   - **Issue**: Design prototype shows NPC mood (`温和/思索/严肃`) and title (`杏林前辈 · 六十年临证`), but document doesn't specify where this data originates.
   - **Location**: Section 4.2 (功能效果) - NPC信息展示
   - **Risk**: Implementation cannot proceed without knowing data source; backend may not provide these fields.
   - **Recommendation**: Add data source specification:
     - NPC mood: from Hermes backend response? From NPC config file?
     - NPC title: static config or dynamic from backend?
     - Define DialogUIOptions interface to include these fields

### Ambiguities (模糊点)

1. **"React层直接调用SSEClient" - Implementation Details**
   - **Issue**: Architecture shows "SSEClient.chatStream()" in React layer, but SSEClient currently creates new instance per call. Should React create new SSEClient or reuse instance?
   - **Location**: Section 3.1 (架构图) - DialogUI.tsx box
   - **Risk**: Instance management affects abort behavior and state tracking. Creating new instance each call may cause memory issues or race conditions.
   - **Recommendation**: Specify SSEClient instantiation pattern:
     - Single instance per DialogUI.tsx component lifecycle
     - Or new instance per chatStream call (with cleanup)

2. **GameStateBridge Extension Method**
   - **Issue**: Document mentions "GameStateBridge.setDialogHistory" but current GameStateBridge.ts has no dialog history support. How should this be added?
   - **Location**: Section 5.3 (架构验收) - "GameStateBridge扩展"
   - **Risk**: Without interface specification, implementation may add methods inconsistently, affecting test compatibility.
   - **Recommendation**: Add GameStateBridge extension interface definition:
     ```typescript
     interface DialogHistoryEntry {
       role: 'narration' | 'npc' | 'player' | 'system';
       text: string;
       name?: string;
       mood?: string;
       timestamp: number;
     }

     // Methods to add:
     getDialogHistory(npcId: string): DialogHistoryEntry[];
     setDialogHistory(npcId: string, history: DialogHistoryEntry[]): void;
     appendDialogEntry(npcId: string, entry: DialogHistoryEntry): void;
     ```

3. **预设选项列表 Scope**
   - **Issue**: Design prototype shows preset options (深问/取穴/食疗/自述), but document excludes "预设选项生成" as Phase 3. Does this mean Phase 2.5 will have static options?
   - **Location**: Section 2.2 (本次不包含) vs Section 4.3 (交互效果)
   - **Risk**: Implementation confusion - will options be hard-coded or omitted entirely?
   - **Recommendation**: Clarify Phase 2.5 preset options approach:
     - Hard-coded static options (placeholder for Phase 3)
     - Or no options in Phase 2.5 (only free input)

### Contradictions (矛盾点)

1. **E2E Test Selector Compatibility**
   - **Issue**: Existing tests (`tests/e2e/npc-dialog.spec.ts`) access `__DIALOG_UI__` global state set by Phaser DialogUI.ts. React DialogUI.tsx will need different global contract. Document mentions "迁移后19/19通过" but doesn't address test selector migration.
   - **Location**: Section 5.4 (测试覆盖率) vs existing `npc-dialog.spec.ts`
   - **Risk**: Tests may fail during migration if global state contract changes without coordination.
   - **Recommendation**: Specify test migration plan:
     - Define `__DIALOG_UI__` contract that both implementations honor
     - Or create new `__DIALOG_UI_TSX__` for React version with test update
     - Document test selector changes in acceptance criteria

2. **尺寸定义不一致**
   - **Issue**: Design prototype (`dialog-scroll.jsx`) shows dimensions `width: '460px', height: '760px'`, but existing game window is `1280×720`. Document doesn't specify how dialog dimensions will fit within game window.
   - **Location**: `docs/ui/对话窗口/dialog-scroll.jsx` vs project context (game window 1280×720)
   - **Risk**: Dialog may overflow game window or appear misaligned. Experience doc `2026-05-08` warns about positioning issues.
   - **Recommendation**: Specify dialog positioning within game window:
     - Dialog centered at game canvas center (640, 360)?
     - Or positioned relative to game viewport?
     - Account for game offset (160, 90) when game is FIT scaled

### Clarification Needed (待澄清点)

1. **TCM_DATA扩展策略**
   - The demo TCM_DATA has limited entries. Need clarification on whether Phase 2.5 uses demo data or requires production data integration.

2. **DialogUI.ts弃用时间线**
   - When exactly should DialogUI.ts be removed? After all tests pass, or during migration?

---

## Recommendations

### Must Fix Before Implementation

1. **Add Migration Transition Strategy**
   - Define clear phases: coexistence → validation → deprecation
   - Specify `__DIALOG_UI__` global state contract for test compatibility
   - Document which tests need selector updates

2. **Add Error Handling Specification**
   - SSE connection failure handling
   - Hermes backend unavailability UI state
   - Tool call failure notification

3. **Define GameStateBridge Extension Interface**
   - Provide TypeScript interface for `getDialogHistory/setDialogHistory`
   - Specify data structure for dialog history entries

### Should Fix (Recommended)

1. **Specify TCM_DATA Strategy**
   - Clarify: demo data migration or production data integration
   - Define data schema contract

2. **Clarify NPC Mood/Title Data Source**
   - Specify backend response fields or config file structure
   - Add to DialogUIOptions interface

3. **Specify SSEClient Instantiation Pattern**
   - Single instance per component or per-call
   - Cleanup/abort behavior

### Optional Improvements

1. **Add Dialog Positioning Specification**
   - Reference experience doc `2026-05-08` lessons
   - Define positioning within game window with FIT scaling

2. **Add Visual Mock or Wireframe**
   - Current design has detailed prototype but no integration mock showing dialog within game context

---

## Cross-Reference Verification

### Project Context Checks

| Check | Status | Notes |
|-------|--------|-------|
| Phaser 3 + TypeScript alignment | ✅ | Architecture uses React+TypeScript with Phaser events |
| Directory structure compliance | ✅ | Document correctly in `docs/superpowers/specs/phase2.5/` |
| Naming convention | ✅ | File name `2026-05-14-dialog-ui-html-embedding-design.md` follows convention |
| Existing systems reference | ✅ | References NPC Agent, ModalUI, HTML小游戏 patterns |
| Test coverage reference | ✅ | Mentions 80% coverage but focuses on E2E tests |

### Code Cross-Reference Issues

| File | Issue |
|------|-------|
| `src/ui/DialogUI.ts` | Current implementation sets `__DIALOG_UI__` with `npcId, npcName, isGenerating, currentText, visible, isInputVisible` - React version must match or tests break |
| `src/utils/GameStateBridge.ts` | No dialog history support - needs extension as document specifies |
| `docs/ui/对话窗口/rich-text.jsx` | TCM_DATA demo only - production integration unclear |
| `tests/e2e/npc-dialog.spec.ts` | Tests use `__DIALOG_UI__` global - selector compatibility not addressed |

---

## Final Verdict

- **Status**: **Needs Revision**
- **Reason**: Critical omissions in migration strategy and error handling. Test compatibility between Phaser and React implementations not addressed. Data source specifications (TCM_DATA, NPC mood/title) missing.
- **Blocking Issues**:
  1. Migration transition plan - affects test stability
  2. GameStateBridge extension interface - needed before implementation
  3. Error handling specification - affects UX quality

---

## Document Quality Summary

| Aspect | Rating | Comment |
|--------|--------|---------|
| Structure | Excellent | Clear sections, logical flow |
| Technical Depth | Good | Architecture diagram, data flow clear |
| Implementation Readiness | Medium | Missing key specs for data sources and migration |
| Test Coverage Planning | Good | E2E criteria specified |
| Risk Assessment | Good | Risk table provided with mitigation |

**Overall**: Well-structured document with clear problem definition and solution architecture. Needs supplementation for implementation details: migration strategy, error handling, and data source specifications.