# STAFF — Legacy Match Editor 0.24.2 regression and rollback

## Rejected release
0.24.2 physically extracted the 581-line Legacy Match Editor boundary.

Automated static checks passed, but manual runtime validation exposed:
- formation did not reposition tokens;
- token names did not synchronize;
- captain/vice behavior was broken;
- token dragging was broken;
- after entering the own-team section, later Match sections stopped responding.

0.24.2 is therefore rejected as a stable baseline.

## Corrective release
0.24.3 is rebuilt from the manually validated 0.24.1 baseline.
All decompositions through 0.24.1 remain intact.
Only the attempted Legacy Match Editor extraction is abandoned.

## Beyond the bug
The Legacy Match Editor must first be segmented internally by responsibility:
1. formation + token positioning;
2. lineup + captain/vice + bench;
3. match events;
4. opponent formation;
5. draft persistence;
6. report preview/publish.

Only after each internal segment has a behavior-oriented regression contract should
physical extraction resume one segment at a time.
