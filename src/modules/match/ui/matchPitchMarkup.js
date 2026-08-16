export function matchPitchMarkingsHtml({ idPrefix = 'match-pitch' } = {}) {
  const topArcClipId = `${idPrefix}-top-arc-clip`
  const bottomArcClipId = `${idPrefix}-bottom-arc-clip`

  return `<svg class="match-pitch-svg" viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="${topArcClipId}"><rect x="0" y="18.5" width="68" height="86.5"></rect></clipPath>
      <clipPath id="${bottomArcClipId}"><rect x="0" y="0" width="68" height="86.5"></rect></clipPath>
    </defs>

    <g class="match-pitch-lines">
      <rect class="pitch-touchline" x="2" y="2" width="64" height="101" rx="0.15"></rect>
      <line class="pitch-halfway" x1="2" y1="52.5" x2="66" y2="52.5"></line>
      <circle class="pitch-centre-circle" cx="34" cy="52.5" r="9.15"></circle>
      <circle class="pitch-centre-spot" cx="34" cy="52.5" r="0.28"></circle>

      <rect class="pitch-penalty-area pitch-penalty-area-top" x="13.84" y="2" width="40.32" height="16.5"></rect>
      <rect class="pitch-penalty-area pitch-penalty-area-bottom" x="13.84" y="86.5" width="40.32" height="16.5"></rect>
      <rect class="pitch-goal-area pitch-goal-area-top" x="24.84" y="2" width="18.32" height="5.5"></rect>
      <rect class="pitch-goal-area pitch-goal-area-bottom" x="24.84" y="97.5" width="18.32" height="5.5"></rect>

      <circle class="pitch-penalty-spot pitch-penalty-spot-top" cx="34" cy="13" r="0.28"></circle>
      <circle class="pitch-penalty-spot pitch-penalty-spot-bottom" cx="34" cy="92" r="0.28"></circle>
      <circle class="pitch-penalty-arc pitch-penalty-arc-top" cx="34" cy="13" r="9.15" clip-path="url(#${topArcClipId})"></circle>
      <circle class="pitch-penalty-arc pitch-penalty-arc-bottom" cx="34" cy="92" r="9.15" clip-path="url(#${bottomArcClipId})"></circle>

      <path class="pitch-corner" d="M2 3 A1 1 0 0 1 3 2"></path>
      <path class="pitch-corner" d="M65 2 A1 1 0 0 1 66 3"></path>
      <path class="pitch-corner" d="M2 102 A1 1 0 0 0 3 103"></path>
      <path class="pitch-corner" d="M65 103 A1 1 0 0 0 66 102"></path>
    </g>

    <g class="match-pitch-goal match-pitch-goal-top">
      <rect x="30.34" y="2" width="7.32" height="1.55"></rect>
      <line x1="32.17" y1="2" x2="32.17" y2="3.55"></line>
      <line x1="34" y1="2" x2="34" y2="3.55"></line>
      <line x1="35.83" y1="2" x2="35.83" y2="3.55"></line>
      <line x1="30.34" y1="2.78" x2="37.66" y2="2.78"></line>
    </g>
    <g class="match-pitch-goal match-pitch-goal-bottom">
      <rect x="30.34" y="101.45" width="7.32" height="1.55"></rect>
      <line x1="32.17" y1="101.45" x2="32.17" y2="103"></line>
      <line x1="34" y1="101.45" x2="34" y2="103"></line>
      <line x1="35.83" y1="101.45" x2="35.83" y2="103"></line>
      <line x1="30.34" y1="102.22" x2="37.66" y2="102.22"></line>
    </g>
  </svg>`
}
