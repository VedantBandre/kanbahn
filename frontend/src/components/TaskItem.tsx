"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { Board, Task } from "@/lib/types";

type Props = { boardId: number; columnId: number; task: Task };

const clone = <T,>(v: T): T =>
  typeof (globalThis as any).structuredClone === "function"
    ? (structuredClone as any)(v)
    : JSON.parse(JSON.stringify(v));

export default function TaskItem({ boardId, columnId, task }: Props) {
  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const qc = useQueryClient();
  const key = ["board", String(boardId)] as const;

  async function saveTitle() {
    if (!title.trim() || title === task.title) { setEditing(false); return; }
    setBusy(true); setErr(null);

    // optimistic: update title locally
    const prev = qc.getQueryData<Board>(key);
    qc.setQueryData<Board>(key, (old) => {
      if (!old) return old;
      const copy = clone(old);
      const col = copy.columns.find(c => c.id === columnId);
      if (col) {
        const t = col.tasks.find(t => t.id === task.id);
        if (t) t.title = title;
      }
      return copy;
    });

    try {
      await api.patch<Task>(`/tasks/${task.id}/`, { title });
      setEditing(false);
    } catch {
      // rollback
      qc.setQueryData<Board>(key, prev);
      setErr("Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this task?")) return;
    setBusy(true); setErr(null);

    const prev = qc.getQueryData<Board>(key);
    // optimistic remove
    qc.setQueryData<Board>(key, (old) => {
      if (!old) return old;
      const copy = clone(old);
      const col = copy.columns.find(c => c.id === columnId);
      if (col) col.tasks = col.tasks.filter(t => t.id !== task.id);
      return copy;
    });

    try {
      // backend delete endpoint from earlier: /tasks/<id>/delete/
      await api.delete(`/tasks/${task.id}/delete/`);
    } catch {
      qc.setQueryData<Board>(key, prev);
      setErr("Failed to delete.");
    } finally {
      setBusy(false);
    }
  }

  if (isEditing) {
    return (
      <li style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
        <form onSubmit={(e)=>{e.preventDefault(); saveTitle();}} style={{ display:"flex", gap:8 }}>
          <input value={title} onChange={e=>setTitle(e.target.value)} disabled={busy} style={{ flex:1 }} />
          <button disabled={busy} type="submit">{busy ? "Saving…" : "Save"}</button>
          <button type="button" onClick={()=>{ setTitle(task.title); setEditing(false); }} disabled={busy}>Cancel</button>
        </form>
        {err && <div style={{ color:"red", fontSize:12, marginTop:6 }}>{err}</div>}
      </li>
    );
  }

  return (
    <li style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8, display:"flex", justifyContent:"space-between", gap:8 }}>
      <span>{task.title}</span>
      <span style={{ display:"flex", gap:6 }}>
        <button onClick={()=>setEditing(true)} disabled={busy}>Edit</button>
        <button onClick={remove} disabled={busy}>Delete</button>
      </span>
    </li>
  );
}
