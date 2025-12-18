import { apiFetch } from "./client"

export interface LoginPayload {
  username: string
  password: string
}

export interface SignUpPayload {
  username: string
  password: string
  nickname: string
}

export async function login(payload: LoginPayload) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function signup(payload: SignUpPayload) {
  return apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}