function cleanLocation(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function getTeamLocationOptions(facilities = [], extraLocations = []) {
  const seen = new Set()
  const result = []
  ;[...facilities.map((facility) => facility?.name ?? facility), ...extraLocations].forEach((value) => {
    const location = cleanLocation(value)
    if (!location) return
    const key = location.toLocaleLowerCase('it-IT')
    if (seen.has(key)) return
    seen.add(key)
    result.push(location)
  })
  return result.sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
}

export function hasTeamLocation(options = [], value = '') {
  const target = cleanLocation(value).toLocaleLowerCase('it-IT')
  return Boolean(target) && options.some((item) => cleanLocation(item?.name ?? item).toLocaleLowerCase('it-IT') === target)
}
