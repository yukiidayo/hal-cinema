export type SessionData = {
  memberId: number
}

export type AppEnv = {
  Variables: {
    requestId: string
    session: SessionData | null
  }
}
