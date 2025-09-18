from django.shortcuts import render

# rest imports
from rest_framework.decorators import api_view
from rest_framework.response import Response


# Create your views here.

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})