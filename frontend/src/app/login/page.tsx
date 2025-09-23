"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setErr] = useState<string | null>(null);
  const setAccess = useAuth((s) => s.setAccess);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const { data } = await api.post("/auth/jwt/create/", { username, password });
      setAccess(data.access);
      router.push("/boards");
    } catch {
      setErr("Invalid credentials or server error.");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "64px auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Login</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input placeholder="username" value={username} onChange={e=>setU(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setP(e.target.value)} />
        {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}
        <button>Sign in</button>
      </form>
    </div>
  );
}