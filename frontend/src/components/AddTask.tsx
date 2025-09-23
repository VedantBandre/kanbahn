"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Board, Task } from "@/lib/types";

type Props = { boardId: number; columnId: number };

const clone = <T,>(v: T): T =>
  typeof (globalThis as any).structuredClone === "function"
    ? (structuredClone as any)(v)
    : JSON.parse(JSON.stringify(v));

export default function AddTask({ boardId, columnId }: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();

  const queryKey = ["board", String(boardId)] as const;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setErr(null);

    const optimisticId = Math.floor(Math.random() * 1e9);

    // Optimistic add
    qc.setQueryData<Board>(queryKey, (old) => {
      if (!old) return old;
      const copy = clone(old);
      const col = copy.columns.find((c) => c.id === columnId);
      if (col) {
        col.tasks.unshift({
          id: optimisticId,
          title,
          description: "",
          position: 0,
          column: columnId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          labels: [],
        });
      }
      return copy;
    });

    try {
      const { data } = await api.post<Task>("/tasks/", {
        title,
        description: "",
        column: columnId,
        label_ids: [],
      });

      // Replace optimistic with real task
      qc.setQueryData<Board>(queryKey, (old) => {
        if (!old) return old;
        const copy = clone(old);
        const col = copy.columns.find((c) => c.id === columnId);
        if (col) {
          const idx = col.tasks.findIndex((t) => t.id === optimisticId);
          if (idx !== -1) col.tasks[idx] = data;
          else col.tasks.unshift(data);
        }
        return copy;
      });

      setTitle("");
    } catch {
      // Rollback on failure
      qc.setQueryData<Board>(queryKey, (old) => {
        if (!old) return old;
        const copy = clone(old);
        const col = copy.columns.find((c) => c.id === columnId);
        if (col) col.tasks = col.tasks.filter((t) => t.id !== optimisticId);
        return copy;
      });
      setErr("Failed to create task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleAdd} style={{ display: "flex", gap: 6, marginTop: 8 }}>
      <input
        placeholder="New task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
        style={{ flex: 1 }}
      />
      <button disabled={loading}>{loading ? "Adding…" : "Add"}</button>
      {err && <span style={{ color: "red", fontSize: 12 }}>{err}</span>}
    </form>
  );
}
