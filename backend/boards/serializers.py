from rest_framework import serializers
from .models import Board, Column, Task, Label


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ["id", "name", "color"]


class TaskSerializer(serializers.ModelSerializer):
    label_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Label.objects.all(), source="labels"
    )

    class Meta:
        model = Task
        fields = ["id","title","description","position","column","label_ids","due_at","created_at","updated_at"]


class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        tasks = Column
        fields = ["id","name","position","tasks"]
    

class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    labels = LabelSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ["id", "name", "created_at", "columns", "labels"]