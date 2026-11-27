from rest_framework import serializers

from api.models import DemandeOrganisateur

class DemandeOrganisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeOrganisateur
        fields = "__all__"
        read_only_fields = ["id", "utilisateur", "statut", "date_demande", "date_traitement", "traite_par"]
