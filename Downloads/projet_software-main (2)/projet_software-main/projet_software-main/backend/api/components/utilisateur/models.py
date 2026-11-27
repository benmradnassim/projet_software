from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UtilisateurManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Une adresse e-mail est obligatoire.")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Utilisateur.Role.ADMIN)
        if extra_fields.get("is_staff") is not True or extra_fields.get("is_superuser") is not True:
            raise ValueError("Un superutilisateur doit avoir is_staff et is_superuser à True.")
        return self._create_user(email, password, **extra_fields)

class Utilisateur(AbstractUser):
    class Role(models.TextChoices):
        UTILISATEUR = "utilisateur", "Utilisateur"
        CITOYEN = "citoyen", "Citoyen"
        ORGANISATEUR = "organisateur", "Organisateur"
        ADMIN = "admin", "Admin"

    class Statut(models.TextChoices):
        ACTIF = "actif", "Actif"
        BLOQUE = "bloque", "Bloqué"
        INACTIF = "inactif", "Inactif"

    username = None
    email = models.EmailField(unique=True)
    prenom = models.CharField(max_length=100, blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    date_inscription = models.DateTimeField(default=timezone.now, editable=False)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.ACTIF)
    adresse = models.CharField(max_length=255, blank=True)
    ville = models.CharField(max_length=100, blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    niveau_acces = models.CharField(max_length=100, blank=True)
    nom_organisation = models.CharField(max_length=200, blank=True)
    date_validation = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.UTILISATEUR)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]
    objects = UtilisateurManager()

    @property
    def nom_complet(self):
        return self.get_full_name() or self.email

    def __str__(self):
        return self.nom_complet
