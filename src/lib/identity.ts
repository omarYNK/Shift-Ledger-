import { cookies } from "next/headers";

const COOKIE_NAME = "shiftledger_identity";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type Identity =
  | { type: "admin" }
  | { type: "employee"; employeeId: string; employeeName: string };

export async function getIdentity(): Promise<Identity | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.type === "admin") return { type: "admin" };
    if (parsed?.type === "employee" && parsed.employeeId && parsed.employeeName) {
      return {
        type: "employee",
        employeeId: parsed.employeeId,
        employeeName: parsed.employeeName,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setIdentity(identity: Identity) {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(identity), {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

export async function clearIdentity() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
