from django.urls import path

from .views import (
    ConsentementCampagneView,
    ConsentementListView,
    ConsentementRefuserView,
    ConsentementValiderView,
    JournalAuditListView,
)

urlpatterns = [
    path(
        "campagnes/<int:campagne_id>/consentement/",
        ConsentementCampagneView.as_view(),
        name="gouvernance-consentement-campagne",
    ),
    path("consentements/", ConsentementListView.as_view(), name="gouvernance-consentements"),
    path(
        "consentements/<int:consentement_id>/valider/",
        ConsentementValiderView.as_view(),
        name="gouvernance-consentement-valider",
    ),
    path(
        "consentements/<int:consentement_id>/refuser/",
        ConsentementRefuserView.as_view(),
        name="gouvernance-consentement-refuser",
    ),
    path("journal-audit/", JournalAuditListView.as_view(), name="gouvernance-journal-audit"),
]
