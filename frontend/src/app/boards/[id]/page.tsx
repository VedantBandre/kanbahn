"use client";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/lib/store";
import type { Board } from "@/lib/types";
import AddTask from "@/components/AddTask";
import SortableTask from "@/components/SortableTask";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

const clone = <T,>(v: T): T =>
  typeof (globalThis as any).structuredClone === "function"
    ? (structuredClone as any)(v)
    : JSON.parse(JSON.stringify(v));

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const access = useAuth((s) => s.access);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["board", id],
    queryFn: async () => (await api.get<Board>(`/boards/${id}/`)).data,
    enabled: !!access && !!id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  if (!access) return <p>Please log in.</p>;
  if (q.isLoading) return <p>Loading…</p>;
  if (q.isError || !q.data) return <p style={{ color: "red" }}>Failed to load board.</p>;

  const board = q.data;

  function containerId(colId: number) {
    return `col-${colId}`;
  }
  function parseColId(cid: string) {
    return Number(cid.replace("col-", ""));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = Number(active.id);
    const overId = Number(over.id);

    // Source/destination containers (columns)
    const fromContainer = (active.data.current as any)?.sortable?.containerId as string | undefined;
    const toContainer = (over.data.current as any)?.sortable?.containerId as string | undefined;
    if (!fromContainer || !toContainer) return;

    const fromColId = parseColId(fromContainer);
    const toColId = parseColId(toContainer);

    // If same place, skip
    if (fromColId === toColId && activeId === overId) return;

    // Compute destination index (position) based on overId
    const destCol = board.columns.find((c) => c.id === toColId);
    if (!destCol) return;

    const toIndex = Math.max(
      0,
      destCol.tasks.findIndex((t) => t.id === overId)
    );

    // Optimistic update: move task locally
    const key = ["board", String(board.id)] as const;
    const previous = qc.getQueryData<Board>(key);

    qc.setQueryData<Board>(key, (old) => {
      if (!old) return old;
      const draft = clone(old);

      const src = draft.columns.find((c) => c.id === fromColId);
      const dst = draft.columns.find((c) => c.id === toColId);
      if (!src || !dst) return draft;

      // Remove from source
      const idx = src.tasks.findIndex((t) => t.id === activeId);
      if (idx === -1) return draft;
      const [moved] = src.tasks.splice(idx, 1);

      // Insert into destination
      const clampedIndex = Math.min(Math.max(0, toIndex), dst.tasks.length);
      dst.tasks.splice(clampedIndex, 0, { ...moved, column: toColId });

      // Reindex positions (optional nice-to-have)
      src.tasks.forEach((t, i) => (t.position = i));
      dst.tasks.forEach((t, i) => (t.position = i));

      return draft;
    });

    try {
      await api.post("/tasks/reorder/", {
        moves: [{ task_id: activeId, to_column: toColId, to_position: toIndex }],
      });
    } catch {
      // Roll back on failure
      qc.setQueryData<Board>(["board", String(board.id)], previous);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>{board.name}</h1>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)" }}>
          {board.columns.map((c) => (
            <div key={c.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              <h2 style={{ fontWeight: 600, marginBottom: 8 }}>{c.name}</h2>

              {/* The container id here lets us know which column is being hovered */}
              <SortableContext
                id={containerId(c.id)}
                items={c.tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul style={{ display: "grid", gap: 8, minHeight: 24 }}>
                  {c.tasks.map((t) => (
                    <SortableTask key={t.id} task={t} boardId={board.id} columnId={c.id} />
                  ))}
                  {c.tasks.length === 0 && <li style={{ opacity: 0.6, fontSize: 12 }}>No tasks</li>}
                </ul>
              </SortableContext>

              <AddTask boardId={board.id} columnId={c.id} />
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
