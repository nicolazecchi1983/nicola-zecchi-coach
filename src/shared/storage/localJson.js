export function readLocalJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}
