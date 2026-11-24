from rest_framework import serializers

from api.models import DemandeParticipationCampagne

class DemandeParticipationCampagneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeParticipationCampagne
        fields = [
            "id",
            "utilisateur",
            "campagne",
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
        ]
        read_only_fields = ["id", "utilisateur", "date_demande", "statut", "code_qr"]

    def validate(self, attrs):
        request = self.context.get("request")
        if self.instance is not None:
            if self.instance.statut != self.instance.Statut.EN_ATTENTE:
                raise serializers.ValidationError({"detail": "Seules les participations en attente peuvent être modifiées."})
            if "campagne" in attrs:
                raise serializers.ValidationError({"campagne": "La campagne d'une demande existante ne peut pas être modifiée."})
            values = {
                field: attrs.get(field, getattr(self.instance, field))
                for field in ("nom", "prenom", "cin", "telephone", "adresse", "motif")
            }
            self._validate_participant(values)
            return attrs

        values = {
            field: attrs.get(field, "")
            for field in ("nom", "prenom", "cin", "telephone", "adresse", "motif")
        }
        self._validate_participant(values)

        campagne = attrs.get("campagne")
        if request is None or campagne is None:
            return attrs

        if campagne.organisateur_id == request.user.id:
            raise serializers.ValidationError({"campagne": "Vous ne pouvez pas participer à votre propre campagne."})
        if campagne.statut != "en_cours":
            raise serializers.ValidationError({"campagne": "Cette campagne n'accepte pas de nouvelles participations."})
        if DemandeParticipationCampagne.objects.filter(
            utilisateur=request.user,
            campagne=campagne,
        ).exclude(statut=DemandeParticipationCampagne.Statut.ANNULEE).exists():
            raise serializers.ValidationError({"campagne": "Vous avez déjà envoyé une demande pour cette campagne."})
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
        phone_digits = "".join(ch for ch in telephone if ch.isdigit())
        if phone_digits.startswith("216"):
            phone_digits = phone_digits[3:]
        if len(phone_digits) != 8:
            raise serializers.ValidationError({"telephone": "Le téléphone doit contenir 8 chiffres."})
        if len(adresse) < 5:
            raise serializers.ValidationError({"adresse": "Saisissez une adresse complète."})
        if len(motif) < 10:
            raise serializers.ValidationError({"motif": "Le motif doit contenir au moins 10 caractères."})
