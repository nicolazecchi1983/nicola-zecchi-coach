const noop = async () => {}

/**
 * Creates the small public contract used by the application shell.
 * Feature modules remain free to keep their own internal structure; the shell
 * only knows how to prepare, render and dispose a module.
 */
export function createAppModule({
  key,
  render,
  prepare = noop,
  dispose = noop,
}) {
  if (!key || typeof key !== 'string') {
    throw new TypeError('App module key must be a non-empty string')
  }
  if (typeof render !== 'function') {
    throw new TypeError(`App module "${key}" must expose render()`)
  }
  if (typeof prepare !== 'function' || typeof dispose !== 'function') {
    throw new TypeError(`App module "${key}" has an invalid lifecycle hook`)
  }

  return Object.freeze({
    key,
    prepare,
    render,
    dispose,
  })
}
