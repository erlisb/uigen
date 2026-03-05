// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => {
        const value = cookieStore.get(name);
        return value !== undefined ? { value } : undefined;
      },
      set: (name: string, value: string) => cookieStore.set(name, value),
      delete: (name: string) => cookieStore.delete(name),
    }),
}));

import { createSession } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  cookieStore.clear();
});

// --- createSession ---

test("createSession sets an auth-token cookie", async () => {
  await createSession("user-1", "test@example.com");
  expect(cookieStore.has("auth-token")).toBe(true);
});

test("createSession stores a JWT with the correct userId and email", async () => {
  await createSession("user-42", "hello@example.com");
  const token = cookieStore.get("auth-token")!;
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("hello@example.com");
});

