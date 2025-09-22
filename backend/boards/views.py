from django.shortcuts import render

# rest imports
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# db models and serializers
from .models import Board, Column, Label
from .serializers import BoardSerializer

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