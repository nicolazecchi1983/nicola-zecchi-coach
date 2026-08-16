# STAFF — Architecture Decomposition Phase 12

Baseline: 0.24.0 (manually validated)

Physical extraction:
- Training Draft + Voice interaction wiring -> `src/modules/training/events/trainingDraftAndVoiceEvents.js`

Preserved:
- browser speech recognition lifecycle;
- live transcription;
- draft autosave and queued saves;
- latest draft restore;
- narration parsing;
- clear/analyze actions.

Existing Supabase draft persistence is injected from the composition root.
No schema, RLS, source-of-truth or Training Editor changes.

This phase intentionally does not touch the 756-line Training Editor boundary.
