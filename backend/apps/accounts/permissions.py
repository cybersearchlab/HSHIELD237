from rest_framework.permissions import BasePermission

from .models import Role


class IsConsultant(BasePermission):
    message = "Accès réservé aux consultants."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == Role.CONSULTANT)


class IsResponsable(BasePermission):
    message = "Accès réservé aux responsables."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == Role.RESPONSABLE)


class IsAdministrateur(BasePermission):
    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == Role.ADMINISTRATEUR)
