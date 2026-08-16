# STAFF 0.22.0 — Product UI Foundation

## Purpose

Training and Match must look like parts of one product without sharing domain logic.

The canonical visual ownership is:

1. `tokens.css` — STAFF design tokens.
2. `productUi.css` — product page geometry, page headers, numbered section navigation, surfaces and empty states.
3. Domain CSS — only domain-specific layout and compatibility rules.
4. `responsive.css` — final global responsive safety layer.

## Canonical primitives

### Product Page Shell
Class: `product-page-shell`

Owns:
- product content max width;
- horizontal page padding;
- top/bottom page rhythm;
- common title hierarchy.

### Product Section Navigation
Class: `product-section-nav`

Owns:
- visual state;
- text containment;
- equal columns;
- desktop/tablet/mobile behavior.

Domain modules configure only:
- `--product-nav-columns`
- `--product-nav-tablet-columns`
- `--product-nav-mobile-columns`

No tab may receive a width based on its label.

### Product Surface
Class: `product-surface`

Owns:
- background;
- border;
- radius;
- base padding;
- text color.

### Product Empty State
Class: `product-empty-state`

Owns the compact empty-state hierarchy. Empty states must not become large blank billboards.

## Training

Training Sheet and Training Library both use `product-page-shell`.
Training Sheet navigation uses `product-section-nav` with six sections.
Training domain logic, persistence, document generation and workflow are unchanged.

## Match

`MatchWorkspaceShell` composes the Product Page Shell and Product Section Navigation.
Match configures seven navigation sections.
`matchWorkspace.css` is a domain adapter only and must not reimplement page shell or navigation visuals.

## Temporary compatibility debt

`match-native-legacy-host` remains for Mezzolara and Avversario functional logic.
It is explicitly forbidden from owning:
- page geometry;
- navigation;
- outer surface;
- header/footer shell.

This debt should be removed only when functional components are safely extracted from the legacy editor.

## Security / data

0.22.0 is presentation-only:
- no Supabase schema changes;
- no RLS changes;
- no repository changes;
- no state-source changes;
- no document persistence changes.

## Regression rule

Any future Product UI change must verify Training + Match together.
