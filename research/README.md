# Research Findings

This directory contains deep research on each of the core questions for the Wring project.

## Structure

Each research question has its own folder containing:

1. **01-tokenization-typing/** - What representation best supports template discovery?
2. **02-repeat-primitives/** - Which primitives yield high-signal candidates while avoiding pattern explosion?
3. **03-template-formation/** - How to convert repeated spans into parameterized templates?
4. **04-objective-selection/** - What scoring and selection regime works in practice?
5. **05-adjacent-domains/** - Which existing solutions apply and what adaptations are needed?
6. **06-implementation/** - JS/WASM architecture for practical use

Each folder contains:
- **question.md** - The focused research question for AI deep research
- Additional files will be added as research reports are collected and distilled

## Usage

### Querying AI Engines

Each `question.md` file is designed to be provided to AI deep research engines along with the main README.md. The questions reference the project README for full context.

**Example workflow:**
```bash
# Provide both files to get focused research
cat README.md research/01-tokenization-typing/question.md | [ai-engine]
```

### Recording Findings

Research reports should be added to the appropriate question folder. Later, findings will be distilled and organized separately from the question files.

### Cross-references

When findings in one area inform another, add cross-references between folders:
```markdown
See also: [Research Question 3: Template Formation](../03-template-formation/)
```

## Status

All research questions are currently open. Research reports will be accumulated as research progresses.
