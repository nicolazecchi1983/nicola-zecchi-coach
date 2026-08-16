export function releaseGateIncludes(packageJson, scriptName) {
  const suite = packageJson?.staffCheckSuite
  if (Array.isArray(suite)) return suite.includes(scriptName)

  const legacyCheck = String(packageJson?.scripts?.check || '')
  return legacyCheck.includes(`npm run ${scriptName}`) || legacyCheck.includes(scriptName)
}
