# Research Question 3: Template Formation

## Question

How should repeated spans be converted into parameterized templates?

## Key Considerations

**Core question**: When should two co-occurring repeated spans become one template vs remain separate? This is analogous to `Diff_EditCost`—a granularity knob.

**Anchor-sequence search**
- Finding ordered chains (A – gap – B – gap – C) that recur across occurrences
- Event stream techniques: emit (pos, anchorID), then sliding-window join or segment-bucketed joins
- Need O(#candidates) alignment strategy, not O(#candidates²)

**Offset histograms**
- For candidate pairs (A, B), compute distribution of `pos(B) − pos(A)` across occurrences
- Using peaks to indicate consistent relative positioning
- Gating strategies to avoid quadratic blowup

**Multi-occurrence alignment**
- Aligning all instances to infer literal vs slot positions
- Center-star baseline: pick highest-scoring instance, align others pairwise, merge

**Gap analysis**
- Gap entropy as stitching heuristic
- High-entropy gaps → slots; low-entropy gaps → merge adjacent literals
- Thresholds: minimum literal length, maximum slot count, compression gain

**Slot boundaries**
- Aligning with token boundaries
- When to split tokens for MDL improvement without harming interpretability

## Research Findings

### Finding 1: [Title]
**Date**: YYYY-MM-DD
**Source/Method**: [Literature review / Experiment / Analysis]

[Detailed findings]

**Implications**:
-

---

### Finding 2: [Title]
**Date**: YYYY-MM-DD
**Source/Method**:

[Detailed findings]

**Implications**:
-

---

## Open Questions

-
-

## Recommendations

[To be determined based on findings]
