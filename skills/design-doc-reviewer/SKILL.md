---
name: design-doc-reviewer
description: Use when reviewing ANY design document for completeness and quality. Triggers on phrases like "review this design", "check design doc", "evaluate design", "审核设计文档", "评审设计", "设计文档review", or when user provides a design document path for evaluation. ALWAYS use this skill before approving any design document - designs with missing sections, unclear boundaries, or vague acceptance criteria lead to wasted implementation effort.
---

# Design Document Reviewer

## Purpose

Systematically evaluate design documents for completeness, clarity, and actionability. Find gaps, ambiguities, contradictions, and unclear points BEFORE implementation begins.

## Core Principle

**Critical Review, Not Validation**

This is NOT a rubber-stamp approval process. Approach every design document with skepticism and critical thinking. The goal is to surface problems that would cause implementation failures, rework, or unclear outcomes.

## Review Dimensions

Evaluate these 8 dimensions systematically:

### 1. Background (背景)
- **What to check**: Does the document clearly explain WHY this design is needed?
- **Missing signs**: No context, assumes reader knows the situation, no historical background
- **Vague signs**: Background is too generic, doesn't connect to specific project context
- **Questions to ask**: What triggered this design? What's the current state? Why now?

### 2. Problem Definition (问题定义)
- **What to check**: Does the document state SPECIFICALLY what problem it solves?
- **Missing signs**: Problem is implied but not stated, or stated too broadly
- **Vague signs**: "Improve X" without metrics, "Fix performance" without baseline
- **Questions to ask**: What specific pain point? How is it measured now? What's the target state?

### 3. Solution (解决方案)
- **What to check**: Is the technical solution concrete and implementable?
- **Missing signs**: High-level concept only, no technical details, no architecture diagrams
- **Vague signs**: "Use microservices" without specifics, "Add caching" without strategy
- **Questions to ask**: What specific components? What data flow? What interfaces?

### 4. Boundaries (边界)
- **What to check**: Does the document clarify what's IN and OUT of scope?
- **Missing signs**: Scope not mentioned, assumes reader knows limits
- **Vague signs**: "Focus on X" but mentions other features, unclear priority
- **Questions to ask**: What will NOT be implemented? What are the constraints? What's deferred?

### 5. Integration (结合方式)
- **What to check**: Does the document explain how this integrates with existing system?
- **Missing signs**: No mention of existing code, assumes standalone implementation
- **Vague signs**: "Integrate with X" without details, no migration plan
- **Questions to ask**: What existing components interact? What needs modification? What's the migration path?

### 6. Expected Outcome (实现效果)
- **What to check**: Does the document describe concrete results after implementation?
- **Missing signs**: No outcome described, or only technical outcomes
- **Vague signs**: "Better performance" without metrics, "Improved UX" without specifics
- **Questions to ask**: What will users see? What metrics change? What's the success indicator?

### 7. Validation Scope (验收范围)
- **What to check**: Does the document specify WHAT will be tested/validated?
- **Missing signs**: No validation plan, assumes it will "just work"
- **Vague signs**: "Test functionality" without specifics, no edge cases mentioned
- **Questions to ask**: What scenarios will be tested? What edge cases? What won't be tested?

### 8. Acceptance Criteria (验收标准)
- **What to check**: Does the document provide MEASURABLE criteria for approval?
- **Missing signs**: No criteria, or subjective criteria only ("looks good")
- **Vague signs**: "Works correctly" without definition, "Fast enough" without numbers
- **Questions to ask**: What metrics? What test pass rate? What review process?

## Review Process

### Step 1: Read the Document Thoroughly

Read the entire design document. Note:
- Structure and organization
- Missing sections
- Assumptions made
- Unexplained terms

### Step 2: Systematic Dimension Check

Go through each dimension above:
- ✅ = Complete and clear
- ⚠️ = Present but vague/unclear
- ❌ = Missing or severely deficient
- ❓ = Need user clarification

### Step 3: Critical Analysis

**REQUIRED: Use Chinese categorization terms for issue types.**

Find these specific issues and categorize using these EXACT Chinese terms:
- **遗漏点 (Omissions)**: What important aspects are not mentioned?
- **模糊点 (Ambiguities)**: What could be interpreted multiple ways?
- **矛盾点 (Contradictions)**: What statements conflict with each other?
- **待澄清点 (Unclear Points)**: What needs more explanation?

**Language Strategy**:
- Even when reviewing English-language design documents, you MUST use these Chinese terms as section headers
- The analysis content can be in English (matching the document language), but the categorization headers must be Chinese
- This ensures consistent terminology across all reviews regardless of document language

### Step 4: Clarification Questions

**CRITICAL: You MUST use the AskUserQuestion tool, NOT write questions into the output file.**

When you identify unclear points that require user input, you MUST:
- **Invoke the AskUserQuestion tool immediately** (do not write questions into review.md)
- Ask specific questions (not general)
- Provide context for why you're asking
- Limit to 1-4 questions per review
- Questions should resolve specific unclear points or contradictions

**Example - Correct Approach**:
```typescript
// When you find a contradiction like "reduce clicks" vs "add tutorial"
AskUserQuestion({
  questions: [{
    header: "Design Intent",
    question: "The problem states 'reduce from 12 clicks to 5' but the solution adds a 15-step tutorial. Is the tutorial optional/skippable for experienced users, or mandatory for all?",
    options: [
      {label: "Mandatory for all users", description: "Tutorial must be completed - contradicts the 5-click goal"},
      {label: "Optional/skippable (Recommended)", description: "Users can skip tutorial - clarify in design document"}
    ]
  }]
})
```

**Example - Wrong Approach** (DO NOT DO THIS):
```markdown
# DO NOT write questions into review.md file like this:
## Clarification Questions
1. Is the tutorial mandatory? This needs clarification.
```

**When to use AskUserQuestion**:
- You find contradictions in the design (goal vs solution mismatch)
- You need to understand design intent before judging quality
- You identify ambiguous statements that could mean different things
- You need data/schema information to assess implementation feasibility

**Key rule**: If you need user input to complete your review, use AskUserQuestion tool FIRST, then incorporate the answers into your final review. Do not write "clarification needed" sections without actually asking.

### Step 5: Actionable Recommendations

For each problem found, provide:
- **What**: The specific issue
- **Where**: Location in document (section/paragraph)
- **Why**: Why this is a problem (risk of implementation failure)
- **How**: Concrete fix suggestion

Format recommendations as:
```
**Issue**: [Description]
**Location**: [Section name or paragraph]
**Risk**: [Why this matters]
**Recommendation**: [Concrete fix - what to add/change]
```

## Output Format

### Review Summary

```
# Design Document Review: [Document Title/Path]

## Overall Assessment
- **Completeness**: [X/8 dimensions complete]
- **Clarity**: [High/Medium/Low]
- **Actionability**: [Ready for implementation/Needs revision]

## Dimension Analysis
| Dimension | Status | Notes |
|-----------|--------|-------|
| Background (背景) | ✅/⚠️/❌/❓ | [Brief note] |
| Problem Definition (问题定义) | ✅/⚠️/❌/❓ | [Brief note] |
| Solution (解决方案) | ✅/⚠️/❌/❓ | [Brief note] |
| Boundaries (边界) | ✅/⚠️/❌/❓ | [Brief note] |
| Integration (结合方式) | ✅/⚠️/❌/❓ | [Brief note] |
| Expected Outcome (实现效果) | ✅/⚠️/❌/❓ | [Brief note] |
| Validation Scope (验收范围) | ✅/⚠️/❌/❓ | [Brief note] |
| Acceptance Criteria (验收标准) | ✅/⚠️/❌/❓ | [Brief note] |

## Critical Issues Found

**REQUIRED: Use Chinese terms as section headers.**

### 遗漏点 (Omissions)
1. [Issue with recommendation]

### 模糊点 (Ambiguities)
1. [Issue with recommendation]

### 矛盾点 (Contradictions)
1. [Issue with recommendation] (if any)

### 待澄清点 (Unclear Points)
1. [Issue requiring user input - if you haven't already asked via AskUserQuestion]

**Note**: If you identify issues that need clarification, you should have already used the AskUserQuestion tool in Step 4. Don't just list "待澄清点" without asking.

## Recommendations

### Must Fix Before Implementation
1. [Critical recommendation]

### Should Fix (Recommended)
1. [Important but not blocking]

### Optional Improvements
1. [Nice to have]

## Clarification Questions
[If needed - use AskUserQuestion tool]

## Final Verdict
- **Approved**: All critical dimensions complete, no blocking issues
- **Needs Revision**: Missing/unclear critical sections
- **Blocked**: Fundamental problems require user clarification first
```

**Language Strategy**:
- Dimension names should show both English and Chinese: `Background (背景)`
- Issue categorization MUST use Chinese terms as headers: `### 遗漏点`, `### 模糊点`, etc.
- Analysis content can match document language (English for English docs, Chinese for Chinese docs)
- Verdict should be stated clearly in the language matching the document

## Critical Requirements Summary

Based on real-world testing, these requirements are **ABSOLUTELY CRITICAL**:

### 1. AskUserQuestion Tool Usage
**TESTED ISSUE**: Previous version wrote questions into output file instead of using tool.
**FIX**: You MUST invoke the AskUserQuestion tool when you find contradictions or need clarification. DO NOT write "Clarification Questions" section into review.md without asking.

**Correct Pattern**:
- Find contradiction → Immediately invoke AskUserQuestion → Wait for answer → Complete review with answer incorporated
- NOT: Find contradiction → Write question into review.md → Finish review without answer

### 2. Chinese Terminology for Categorization
**TESTED ISSUE**: Previous version used English headers (Omissions, Ambiguities) instead of Chinese terms.
**FIX**: You MUST use Chinese terms as section headers for issue categorization, even when reviewing English documents.

**Correct Pattern**:
- `### 遗漏点` - NOT "### Omissions"
- `### 模糊点` - NOT "### Ambiguities"
- `### 矛盾点` - NOT "### Contradictions"
- `### 待澄清点` - NOT "### Clarification Needed"

**Rationale**: Chinese terms provide consistent terminology across all reviews regardless of document language, making it easier for users to understand issue types.

### 3. Complete 8-Dimension Framework
**TESTED ISSUE**: Without skill, reviewers used different structures causing format mismatch.
**FIX**: You MUST use the exact 8-dimension table with ✅/⚠️/❌/❓ status indicators.

**Required Dimensions** (show with Chinese names):
- Background (背景)
- Problem Definition (问题定义)
- Solution (解决方案)
- Boundaries (边界)
- Integration (结合方式)
- Expected Outcome (实现效果)
- Validation Scope (验收范围)
- Acceptance Criteria (验收标准)

## Anti-Patterns to Avoid

- **Rubber-stamping**: Don't just say "looks good" without critical analysis
- **Soft feedback**: Don't say "could be better" - specify exactly what's wrong
- **Generic suggestions**: Don't suggest "add more details" - say what details to add
- **Skipping questions**: Don't guess unclear points - ask the user

## Integration with Project Context

When reviewing a design document for THIS project (zhongyi_game_v3):

### Project-Specific Checks
- Does the design align with existing architecture (Phaser 3 + TypeScript + Hermes-Agent)?
- Does it reference the correct directory structure (`docs/superpowers/specs/phase{n}/`)?
- Does it follow naming conventions (`YYYY-MM-DD-xxx-design.md`)?
- Does it consider existing systems (NPC Agent, ModalUI, HTML小游戏)?
- Does it specify test requirements (80% coverage, E2E tests)?

### Cross-Reference Checks
- Check against CLAUDE.md principles (Simple至上, 目标+标准驱动)
- Verify design doesn't contradict TODO.md completed work
- Ensure PROGRESS.md is updated if this design starts implementation

## Success Criteria

A successful review:
- Identifies at least one actionable improvement (even in good documents)
- Provides specific locations for each issue
- Offers concrete fixes (not generic advice)
- Asks clarifying questions when truly uncertain
- Gives clear verdict: Approved, Needs Revision, or Blocked