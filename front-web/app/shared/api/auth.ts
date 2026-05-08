import { createContext, useContext } from "react"
import { apiFetch } from "~/shared/api/client"

export type AuthState =
  | { authenticated: false }
  | { authenticated: true; memberId: number }

export type AuthContextValue = {
  auth: AuthState
  setAuth: (auth: AuthState) => void
}

export const AuthContext = createContext<AuthContextValue>({
  auth: { authenticated: false },
  setAuth: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export async function getAuthState(): Promise<AuthState> {
  try {
    return await apiFetch<AuthState>("/auth/me")
  } catch {
    return { authenticated: false }
  }
}

export function safeRedirect(redirect: string | null | undefined): string {
  if (!redirect) return "/"
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect
  return "/"
}
