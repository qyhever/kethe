type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export function notifyUnauthorized() {
  unauthorizedHandler?.()
}
