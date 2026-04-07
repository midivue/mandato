export type Bindings = {
  DB: D1Database
  MAINTENANCE_MODE?: string
  TURNSTILE_SECRET?: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: { requestId: string }
}
