from django.shortcuts import render

# rest imports
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# db models and serializers
from .models import Board, Column, Label, Task
from .serializers import BoardSerializer, TaskSerializer
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db import models

# Create your views here.


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def seed_board(request):
    user = request.user
    # If board already exists, return the first one
    existing = Board.objects.filter(owner=user).first()
    if existing:
        return Response(BoardSerializer(existing).data, status=status.HTTP_200_OK)
    
    board = Board.objects.create(owner=user, name="My First Board")
    Column.objects.bulk_create([
        Column(board=board, name="Backlog", position=0),
        Column(board=board, name="In Progress", position=1),
        Column(board=board, name="Done", position=2),
    ])
    Label.objects.bulk_create([
        Label(board=board, name="bug", color="#EF4444"),
        Label(board=board, name="feature", color="#3B82F6"),
        Label(board=board, name="chore", color="#10B981"),
    ])

    return Response(BoardSerializer(board).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_boards(request):
    qs = Board.objects.filter(owner=request.user).order_by("-created_at")
    return Response(BoardSerializer(qs, many=True).data)


def _user_ownds_board(user, board_id):
    return Board.objects.filter(id=board_id, owner=user).exits()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_task(request):
    # Ensuring column belongs to a board owned by the user
    column = get_object_or_404(Column, id=request.data.get("column"))
    if column.board.owner_id != request.user.id:
        return Response({"detail":"Forbidden"}, status=403)
    
    # Position at column end
    last_pos = Task.objects.filter(column=column).aggregate(max_pos=models.Max("position"))["max_pos"] or 0
    payload = {**request.data, "position": last_pos + 1}
    ser = TaskSerializer(data=payload)
    if ser.is_valid():
        task = ser.save(board=column.board, column=column)
        return Response(TaskSerializer(task).data, status=201)
    return Response(ser.errors, status=400)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_task(request, pk:int):
    task = get_object_or_404(Task, id=pk)
    if task.board.owner_id != request.user.id:
        return Response({"detail":"Forbidden"}, status=403)
    # Allow label_ids updates and basic fields
    ser = TaskSerializer(task, data=request.data, partial=True)
    if ser.is_valid():
        ser.save()
        return Response(ser.data)
    return Response(ser.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_task(request, pk:int):
    task = get_object_or_404(Task ,od=pk)
    if task.board.owner_id != request.user.id:
        return Response({"detail":"Forbidden"}, status=403)
    task.delete()
    return Response(status=204)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def reorder_tasks(request):
    """
    Body: {"moves":[{"task_id":12,"to_column":3,"to_position":0}, ...]}
    """
    moves = request.data.get("moves", [])
    # Prefetching objects to reduce queries
    columns = {c.id: c for c in Column.objects.filter(id__in=[m["to_column"] for m in moves])}
    tasks = {t.id: t for t in Task.objects.filter(id__in=[m["task_id"] for m in moves]).select_related("column", "board")}
    # Validating that all touched boards must belong to the user
    for t in tasks.values():
        if t.board.owner_id != request.user.id:
            return Response({"detail":"Forbidden"}, status=403)
    for c in columns.values():
        if c.board.owner_id != request.user.id:
            return Response({"detail":"Forbidden"}, status=403)
    

    # First applying moves in-memory
    for m in moves:
        t = tasks[m["task_id"]]
        target_col = columns[m["to_column"]]
        t.column = target_col
        t.position = int(m.get("to_position", 0))
    
    # Normalize positions per column
    by_col = {}
    for t in tasks.values():
        by_col.setdefault(t.column_id, []).append(t)
    for col_id, ts in by_col.items():
        # Merge with existing tasks in the column not in moves, then sort
        existing = list(Task.objects.filter(column_id=col_id).exclude(id__in=[x.id for x in ts]))
        merged = existing + ts
        merged.sort(key=lambda x: x.position)
        for i, task in enumerate(merged):
            if task.position != i:
                Task.objects.filter(id=task.id).update(column_id=col_id, position=i)
        
        return Response({"status":"ok"})
    

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_board(request, pk:int):
    board = get_object_or_404(Board, id=pk, owner=request.user)
    return Response(BoardSerializer(board).data)