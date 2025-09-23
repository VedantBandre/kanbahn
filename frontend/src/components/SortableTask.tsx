"use client";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { Task } from "@/lib/types";
import TaskItem from "./TaskItem";

export default function SortableTask({
    task,
    boardId,
    columnId,
}: {
    task: Task;
    boardId: number;
    columnId: number;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform), transition,
        opacity: isDragging ? 0.6 : 1,
        cursor: "grab",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskItem task={task} boardId={boardId} columnId={columnId} />
        </div>
    );
}