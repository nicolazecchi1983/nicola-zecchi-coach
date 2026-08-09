export function renderPlaceholderView(title) {
  return `
    <section class="view page-view">
      <div class="page-head">
        <div>
          <h1>${title}</h1>

          <p>
            <span>SEZIONE PRONTA</span>
            <b>•</b>
            Prossima release
          </p>
        </div>
      </div>

      <div class="placeholder-panel">
        <h2>${title}</h2>

        <p>
          La struttura grafica è pronta per essere collegata a
          Supabase.
        </p>
      </div>
    </section>
  `
}
