export type Bindings = {
  DB: D1Database
  BROWSER: Fetcher
  MEDIA: R2Bucket
  MAINTENANCE_MODE?: string
  TURNSTILE_SECRET?: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: { requestId: string }
}
