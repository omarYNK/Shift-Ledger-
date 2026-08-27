"use client";

import { useState, useTransition } from "react";
import { chooseAdmin } from "@/lib/actions/identity-actions";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("password", password);
    startTransition(async () => {
      try {
        await chooseAdmin(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="choice-card" style={{ marginBottom: 10 }}>
        <h3>I&apos;m the admin</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Manage clients, employees, charges, and invoices.
        </p>
      </div>
      <div className="form-row">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="off"
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={isPending}>
        {isPending ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
