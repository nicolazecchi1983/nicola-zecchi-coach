export function bindStaffColorPickers(root) {
  if (!root) return

  root.querySelectorAll('[data-staff-color-picker]').forEach((field) => {
    if (field.dataset.colorPickerBound === 'true') return
    field.dataset.colorPickerBound = 'true'

    const input = field.querySelector('input[type="color"]')
    if (!input) return

    const syncSelected = () => {
      const current = String(input.value || '').toLowerCase()
      field.querySelectorAll('[data-staff-color-value]').forEach((button) => {
        const selected = String(button.dataset.staffColorValue || '').toLowerCase() === current
        button.classList.toggle('is-selected', selected)
        button.setAttribute('aria-pressed', String(selected))
      })
    }

    field.querySelectorAll('[data-staff-color-value]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.staffColorValue
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    input.addEventListener('input', syncSelected)
    input.addEventListener('change', syncSelected)
    syncSelected()
  })
}
