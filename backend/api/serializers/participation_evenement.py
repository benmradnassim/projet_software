from rest_framework import serializers

from api.models import DemandeParticipationEvenement


class DemandeParticipationEvenementSerializer(serializers.ModelSerializer):
    evenement_titre = serializers.CharField(source="evenement.titre", read_only=True)
    evenement_date = serializers.DateTimeField(source="evenement.date_evenement", read_only=True)
    evenement_lieu = serializers.CharField(source="evenement.lieu", read_only=True)
    utilisateur_nom = serializers.SerializerMethodField()

    class Meta:
        model = DemandeParticipationEvenement
        fields = [
            "id",
            "utilisateur",
            "evenement",
            "date_demande",
            "type",
            "motif",
            "nom",
            "prenom",
            "telephone",
            "cin",
            "adresse",
            "statut",
            "code_qr",
            "evenement_titre",
            "evenement_date",
            "evenement_lieu",
            "utilisateur_nom",
        ]
        read_only_fields = ["id", "utilisateur", "date_demande", "statut", "code_qr"]

    CHAMPS_PARTICIPANT = ("nom", "prenom", "cin", "telephone", "adresse", "motif")

    def validate(self, attrs):
        # Modification par le participant : seulement en attente, sans changer d'événement.
        if self.instance is not None:
            if self.instance.statut != DemandeParticipationEvenement.Statut.EN_ATTENTE:
                raise serializers.ValidationError({"detail": "Seules les participations en attente peuvent être modifiées."})
            if "evenement" in attrs and attrs["evenement"] != self.instance.evenement:
                raise serializers.ValidationError({"evenement": "L'événement d'une demande existante ne peut pas être modifié."})
            valeurs = {f: attrs.get(f, getattr(self.instance, f)) for f in self.CHAMPS_PARTICIPANT}
        else:
            valeurs = {f: attrs.get(f, "") for f in self.CHAMPS_PARTICIPANT}
        self._validate_participant(valeurs)
        return attrs

    @staticmethod
    def _validate_participant(values):
        nom = str(values["nom"]).strip()
        prenom = str(values["prenom"]).strip()
        cin = str(values["cin"]).strip()
        telephone = str(values["telephone"]).strip()
        adresse = str(values["adresse"]).strip()
        motif = str(values["motif"]).strip()
        if len(nom) < 2:
            raise serializers.ValidationError({"nom": "Le nom doit contenir au moins 2 caractères."})
        if len(prenom) < 2:
            raise serializers.ValidationError({"prenom": "Le prénom doit contenir au moins 2 caractères."})
        if not cin.isdigit() or len(cin) != 8:
            raise serializers.ValidationError({"cin": "Le CIN doit contenir exactement 8 chiffres."})
        chiffres = "".join(ch for ch in telephone if ch.isdigit())
        if chiffres.startswith("216"):
            chiffres = chiffres[3:]
        if len(chiffres) != 8:
            raise serializers.ValidationError({"telephone": "Le téléphone doit contenir 8 chiffres."})
        if len(adresse) < 5:
            raise serializers.ValidationError({"adresse": "Saisissez une adresse complète."})
        if len(motif) < 10:
            raise serializers.ValidationError({"motif": "Le motif doit contenir au moins 10 caractères."})

    def get_utilisateur_nom(self, obj):
        user = getattr(obj, "utilisateur", None)
        if not user:
            return ""
        full = getattr(user, "nom_complet", "") or ""
        if full.strip():
            return full.strip()
        return getattr(user, "email", "")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.statut != DemandeParticipationEvenement.Statut.ACCEPTEE:
            data["code_qr"] = None
        return data
