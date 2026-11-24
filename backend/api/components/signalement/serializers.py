"""Serializers for Signalement."""
from api.serializers.signalement import *
from rest_framework import serializers
from .models import Signalement


class SignalementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Signalement
        fields = '__all__'
