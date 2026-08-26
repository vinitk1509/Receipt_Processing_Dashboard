import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class ReceiptStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReceiptCategory(str, enum.Enum):
    TRAVEL_SITE_VISITS = "Travel & Site Visits"
    CLIENT_MEETINGS = "Client Meetings & Dining"
    ACCOMMODATION = "Accommodation & Per Diem"
    SITE_EQUIPMENT = "Site & Safety Equipment"
    SOFTWARE_LICENSES = "Software & Cloud Licenses"
    OFFICE_SUPPLIES = "Office & Project Supplies"
    PROFESSIONAL_TRAINING = "Professional Training & CPD"
    OTHER = "Other"
