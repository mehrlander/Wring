# Research Findings

This directory contains deep research on each of the core questions for the Wring project.

## Structure

Each research question has its own file for collecting findings:

1. **01-tokenization-typing.md** - What representation best supports template discovery?
2. **02-repeat-primitives.md** - Which primitives yield high-signal candidates while avoiding pattern explosion?
3. **03-template-formation.md** - How to convert repeated spans into parameterized templates?
4. **04-objective-selection.md** - What scoring and selection regime works in practice?
5. **05-adjacent-domains.md** - Which existing solutions apply and what adaptations are needed?
6. **06-implementation.md** - JS/WASM architecture for practical use

## Usage

### Querying AI Engines

Each research file is designed to be provided to AI engines along with the main README.md. The questions assume the AI has read the project README for context.

**Example workflow:**
```bash
# Provide both files to get focused research
cat README.md research/01-tokenization-typing.md | [ai-engine]
```

### Recording Findings

For each finding:

1. Add a new "Finding N" section
2. Include date and source/method (literature review, experiment, analysis)
3. Document detailed findings
4. Note implications for the project
5. Update "Open Questions" and "Recommendations" sections as understanding evolves

### Cross-references

When findings in one area inform another, add cross-references:
```markdown
See also: [Research Question 3: Template Formation](./03-template-formation.md#finding-2)
```

## Status

All research questions are currently open. Findings will be accumulated as research progresses.
