# STAFF 0.26.2 — CI Foundation

## Obiettivo

Rendere il release gate STAFF automatico anche sul repository remoto. Il Launcher resta il controllo operativo locale; GitHub Actions diventa il controllo automatico di integrazione su ogni push e pull request.

## Quality gate canonico

Il workflow `.github/workflows/ci.yml` esegue:

1. checkout del repository con credenziali non persistenti;
2. Node.js 22;
3. cache npm basata su `package-lock.json`;
4. `npm ci` per un'installazione deterministica;
5. `npm run ci`.

`npm run ci` delega intenzionalmente a `npm run check`, che è l'unica release gate canonica. In questo modo non esistono due pipeline diverse da mantenere.

La release gate comprende già:

- syntax check;
- architecture/contracts check;
- Vitest domain suite;
- build Vite;
- regression contract post-build.

## Sicurezza

La CI non richiede `.env` o credenziali Supabase per eseguire test statici/domain e build. Il workflow usa solamente permesso `contents: read` e `checkout` con `persist-credentials: false`.

I file `.env` restano ignorati da Git e non devono essere committati nel repository.

## Contratto

`scripts/check-ci-foundation.mjs` protegge la presenza e i punti essenziali della pipeline CI. È incluso nello stesso `npm run check`, quindi una modifica che disattiva accidentalmente la CI viene rilevata dal release gate locale.

## Ownership

- `.github/workflows/ci.yml`: automazione remota GitHub Actions.
- `package.json`: release gate canonico (`check`) e alias CI (`ci`).
- `scripts/check-ci-foundation.mjs`: contratto strutturale della CI.

Non vengono introdotte modifiche a dominio, UI, Supabase, persistenza o runtime applicativo.
