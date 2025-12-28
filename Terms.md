# Template Terminology Brainstorm

## Context

We are focused on identifying template patterns in text—or, by one way of thinking, templates that are *implied* by the text.

“Implied” is interesting. It suggests the template is a characteristic of the text, possibly connected to its generation. A log file implies the format string that produced it. A legal document implies the boilerplate it was drafted from. Often true, not always assumed. We don’t require a generative history; we only require observable repetition with variation.

At the same time, we’re not looking for latent structure hidden beneath the surface. This isn’t topic modeling or dimensionality reduction. The patterns we seek are *right there*—repeated literals, visible variation. The challenge is terminology, not detection.

A template is an abstraction. It is something we recognize *across* instances—the prototype that instances exemplify. When you abstract, you get a type and its tokens, a universal and its particulars, a form and its manifestations. Russell, Wittgenstein, Plato if you like. The template is the form; instances are where it shows up.

So the verbs split naturally:

- An **instance** appears (concrete, locatable, in the text)
- A **template** matches (it aligns with instances, describes their shape)
- A **template** emerges or derives (it comes into being when we recognize what instances share)

“Template” itself may carry baggage—it often implies generation, a mold that produces. But our project inverts that. We’re not stamping out instances from templates; we’re inducing templates from instances. The text exists first. The template is what we find.

This opens two distinct vocabulary needs:

1. **Matching**: How a template relates to text once it exists. Fitting, aligning, seating, binding.
1. **Emerging**: How a template comes into being. Deriving, crystallizing, inducing, distilling.

Different moments, different verbs.

This document brainstorms vocabulary toward those ends—language that respects the abstraction, distinguishes type from token, and honors discovery over generation.

-----

## Guiding Images

**The shape sorter**: The pattern is the hole. Text is the block. The hole has contour (literals) and open space (slots). Various blocks fit, as long as they have the right profile.

**The overlay**: The pattern floats over the document. Opaque regions (literals) and transparent regions (slots). When the opaque parts align with text below, it locks in, lights up. Then lifts off and keeps scanning.

**The machined part**: Two surfaces mate. Tolerance determines how much deviation is allowed. Seating surfaces make contact. Clearance accommodates variation.

**The receptor**: A binding site has shape. The right molecule fits; others don’t. Affinity varies. Specificity is about how selective the site is.

**The crystal**: Structure precipitates out of solution. What was dissolved and diffuse suddenly organizes. The template crystallizes from scattered instances.

**The distillation**: Impurities boil off. What remains is the essence—the shared structure, refined from noisy particulars.

-----

## Part 1: Matching Terminology

*How a template relates to text once it exists.*

### Mechanical Fit

seat, fit, mate, engage, mesh, gear, register, true, square, key, index, dock, berth, home, lock, latch, click, snap, slot (verb), socket, plug, couple, join, mount

*“The pattern seats at three locations.”*

### Contact & Grip

bind, grip, clasp, grab, hold, catch, hook, latch, clinch, clamp, bite, purchase, kiss, press, contact, touch, meet, abut

*“The anchors grip the text; the slots allow play.”*

### Settling Into Place

seat, settle, rest, sit, lodge, nestle, park, land, drop, plant, root, bed, perch, station, post

*“The pattern settles into the text where its literals align.”*

### Alignment & Registration

align, register, true, square, sync, track, home, zero, dial in, index, locate, datum, reference

*“The pattern registers when its anchors coincide with text.”*

### Agreement & Correspondence

agree, accord, match, correspond, jibe, tally, check, comport, harmonize, rhyme, resonate, echo, mirror

*“The pattern and text agree at their anchor points.”*

### Tolerance & Clearance

tolerance, clearance, play, slack, give, room, margin, allowance, fit (loose/tight), agreeable, permissive, insistent, rigid

*“Slot tolerance determines how much variation the pattern admits.”*

-----

## Part 2: Emergence Terminology

*How a template comes into being from instances.*

### Emergence & Arising

emerge, arise, surface, appear, materialize, manifest, come into view, reveal itself, dawn, break through, bubble up, well up, spring up

*“The template emerges when instances accumulate.”*

### Derivation & Origin

derive, follow, result, ensue, proceed, flow, issue, stem, originate, grow from, root in, descend from

*“The template derives from observed repetition.”*

### Extraction & Refinement

extract, distill, refine, isolate, separate, winnow, sift, filter, pan, mine, quarry, dredge, harvest, glean, cull

*“We distill the template from noisy instances.”*

### Crystallization & Precipitation

crystallize, precipitate, coalesce, condense, solidify, gel, set, cure, harden, resolve, clarify, come into focus, nucleate, seed

*“The template crystallizes as structure resolves from repetition.”*

### Inference & Abstraction

infer, deduce, induce, conclude, abstract, generalize, synthesize, construct, reconstruct, reverse-engineer

*“We induce the template from particular instances.”*

### Recognition & Discovery

recognize, discern, perceive, apprehend, identify, make out, pick out, distinguish, detect, discover, uncover, unearth

*“The template is discovered, not invented.”*

-----

## Part 3: Entities and Verbs

|Entity      |Role                                  |Matching                 |Emergence                        |
|------------|--------------------------------------|-------------------------|---------------------------------|
|**Template**|The abstract structure                |seats, binds, registers  |emerges, crystallizes, is induced|
|**Instance**|A concrete occurrence in text         |appears                  |—                                |
|**Anchor**  |A literal that recurs across instances|aligns, grips, holds     |is identified, is extracted      |
|**Slot**    |A variable position                   |accepts, admits, binds to|is inferred, resolves            |

-----

## Notes

We focused here on two aspects of our inquiry:

1. **Matching**: how a template relates to text (seat, bind, register, agree)
1. **Emerging**: how a template comes to be (emerge, derive, crystallize, induce)

We could look further at specific aspects of emergence:

**Scan / Tally** — Finding the recurring substrings. The anchor candidates. This is the plumbing-the-document phase—enumeration, scoring, filtering. Terms: scan, tally, enumerate, survey, census, inventory, count, catalog.

**Assembly / Sequencing** — At this stage we have anchor candidates interleaved with interstitial spans. Which sequences rise to our attention as template material? Terms: assemble, compose, thread, string, chain, sequence, arrange, order, promote, elevate, adopt.

**Resolution / Melding** — Where should adjacent slots be merged over a dispensable literal for efficiency or interpretability? Terms: meld, merge, consolidate, simplify, collapse, relax, coalesce.

**Refinement / Competition** — For replaceability, templates may not partially overlap. Establishing any boundary forecloses any literal or variable from traversing it. When templates conflict, we need a process to resolve optimally. Terms: compete, arbitrate, allocate, exclude, displace, settle, converge, anneal.​​​​​​​​​​​​​​​​