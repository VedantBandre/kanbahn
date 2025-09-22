from django.db import models
from django.conf import settings

# Create your models here.

class Board(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="boards")
    name = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Column(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="columns")
    name = models.CharField(max_length=80)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position"]
    
    def __str__(self):
        return f"{self.board.name} . {self.name}"
    

class Label(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="labels")
    name = models.CharField(max_length=40)
    color = models.CharField(max_length=7)

    def __str__(self):
        return f"{self.name} ({self.color})"


class Task(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="tasks")
    column = models.ForeignKey(Column, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    position = models.PositiveIntegerField(default=0)
    labels = models.ManyToManyField(Label, blank=True)
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="assigned_tasks")
    due_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "created_at"]
    
    def __str__(self):
        return self.title