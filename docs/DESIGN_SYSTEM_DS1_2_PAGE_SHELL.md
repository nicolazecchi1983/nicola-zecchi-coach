# DS1.2 — Page Shell & Visual Hierarchy

## Scope
First visible Design System application after DS1.1. It standardizes page geometry and hierarchy without redesigning domain-specific content.

## Ownership
- `tokens.css`: foundation values.
- `pageShell.css`: page outer rhythm, page header, metadata hierarchy, action alignment, shared section-header primitive.
- `productUi.css`: Training/Match domain shell and section navigation.
- `responsive.css`: final cross-product responsive corrections.

## Rules
1. Domain pages use `.page-view` and `.page-head`; they do not redefine title typography or page spacing.
2. A page has one dominant `h1` and one metadata/context line.
3. Header actions are visually subordinate to the title and may wrap rather than compress.
4. New section headers use `.staff-section-head` and `.staff-section-kicker`.
5. Mobile uses an explicitly stacked page header; it is not a compressed desktop header.
6. The page shell introduces no raw colors and no `!important` overrides.

## Non-goals
- No Dashboard redesign.
- No Training/Match content redesign.
- No change to persistence, routes, workflow or database.
- No broad legacy CSS deletion yet.
