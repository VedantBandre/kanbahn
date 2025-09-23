"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useAuthReady } from "@/lib/useHydrated";

type Board = { id: number; name: string };

export default function BoardsPage() {
  const access = useAuth((s) => s.access);
  const ready = useAuthReady();
  const router = useRouter();

  useEffect(() => {
    if (ready && !access) router.push("/login");
  }, [ready, access, router]);

  const q = useQuery({
    queryKey: ["boards"],
    queryFn: async () => (await api.get<Board[]>("/boards/")).data,
    enabled: ready && !!access,
  });

  if (!ready) return null;            // wait until token is loaded
  if (!access) return null;           // redirecting
  if (q.isLoading) return <p>Loading…</p>;
  if (q.isError) return <p style={{ color: "red" }}>Failed to load boards.</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>My Boards</h1>
      <ul style={{ display: "grid", gap: 8 }}>
        {q.data?.map((b) => (
          <li key={b.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{b.name}</span>
              <Link href={`/boards/${b.id}`}>Open</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
