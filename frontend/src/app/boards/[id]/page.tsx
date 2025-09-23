"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/store";

type Task = { id:number; title:string };
type Column = { id:number; name:string; tasks: Task[] };
type Board = { id:number; name:string; columns: Column[] };

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const access = useAuth((s) => s.access);

  const q = useQuery({
    queryKey: ["board", id],
    queryFn: async () => (await api.get<Board>(`/boards/${id}/`)).data,
    enabled: !!access && !!id,
  });

  if (!access) return <p>Please log in.</p>;
  if (q.isLoading) return <p>Loading…</p>;
  if (q.isError || !q.data) return <p style={{ color: "red" }}>Failed to load board.</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>{q.data.name}</h1>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)" }}>
        {q.data.columns.map((c) => (
          <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            <h2 style={{ fontWeight: 600, marginBottom: 8 }}>{c.name}</h2>
            <ul style={{ display: "grid", gap: 8 }}>
              {c.tasks.map((t) => (
                <li key={t.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>{t.title}</li>
              ))}
              {c.tasks.length === 0 && <li style={{ opacity: 0.6, fontSize: 12 }}>No tasks</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}