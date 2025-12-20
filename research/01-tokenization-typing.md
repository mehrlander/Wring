# Research Question 1: Tokenization + Typing

## Question

What representation best supports template discovery in the context of single-document template induction?

## Key Considerations

**Token granularity**
- Character-level vs token stream (word/punct/whitespace)
- Should token boundaries be discovered from repeated structure rather than imposed?
- How does pre-tokenization affect pattern discovery?

**Typing strategy**
- Pre-typing: normalize values (`<NUM>`, `<DATE>`, `<UUID>`) before mining
- Post-typing: infer types from discovered slot contents
- Baker-style parameterization: normalize to placeholders before mining
- Hybrid approaches: mine on both skeleton and value streams in parallel

**Implications**
- How does typing affect slot encoding cost in MDL?
- What are the trade-offs between mining on "skeleton tokens" vs "value tokens"?
- Impact on pattern frequency vs structural fidelity

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
