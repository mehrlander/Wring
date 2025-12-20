# Research Question 4: Objective + Selection

## Question

What scoring and selection regime works in practice for template induction?

## Key Considerations

**MDL-style objective**
```
gain = savings_from_reuse − (template_cost + slot_encoding_cost + residual_cost)
```

**Open question**: Optimal template selection relates to smallest grammar (NP-hard). What approximation strategies from grammar compression literature apply?

**Cost modeling**
- Preventing degenerates: mostly-slot templates, tiny frequent literals, single-use templates
- Slot encoding cost hierarchy: bounded integer < date < unconstrained string

**Calibration**
- How should costs adjust based on document size, average token length, observed entropy?
- Proxy scores: `coverage × literal_length − slot_entropy_penalty`

**Selection algorithms**
- Weighted interval scheduling: candidate instances as intervals with weight = gain
- Krimp-style greedy: order by length × frequency, accept if total code length decreases

**Termination criteria**
- Coverage threshold
- Diminishing returns
- Template count limit

**Partial matches**
- Policy for when most but not all instances fit a pattern
- Options: exclude outliers to residual, create variant templates, allow fuzzy matching (breaks exact reconstruction)

**Residual classification**
- Distinguishing noise (truly random) from outliers (near-matches that failed threshold)
- Outlier promotion policy: when to force-fit as dirty instance vs keep separate

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
