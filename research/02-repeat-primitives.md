# Research Question 2: Repeat Primitives + Candidate Control

## Question

Which primitives yield high-signal candidates while avoiding pattern explosion in single-document template induction?

## Key Considerations

**Enumeration approaches**
- SA+LCP interval traversal with stack-based pattern emission
- Suffix tree internal node traversal
- Suffix automaton
- Winnowing/fingerprinting as coarse seeding for large documents

**Repeat types**
- Maximal repeats: can't extend without losing occurrences
- Supermaximal repeats: maximal and not contained in any longer repeat with same frequency
- Closed repeats: no strict superpattern with the same occurrence set

**Which repeat type produces cleaner literal skeletons across different document types** (logs vs legal text vs source code)?

**Candidate control**
- Frequency and length thresholds
- Dominance/containment pruning strategies
- Managing output-sensitive complexity

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
