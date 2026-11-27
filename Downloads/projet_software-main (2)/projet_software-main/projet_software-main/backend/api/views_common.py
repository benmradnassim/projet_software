"""Shared endpoints not tied to a single domain resource."""
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import InscriptionSerializer, UtilisateurSerializer
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    return Response({"status": "ok", "service": "moubedra-api"})
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = InscriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UtilisateurSerializer(user).data, status=status.HTTP_201_CREATED)
