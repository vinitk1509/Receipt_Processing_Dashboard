import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class ReceiptStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReceiptCategory(str, enum.Enum):
    TRAVEL = "Travel"
    MEALS = "Meals"
    ACCOMMODATION = "Accommodation"
    OFFICE_SUPPLIES = "Office Supplies"
    TRANSPORTATION = "Transportation"
    SOFTWARE = "Software"
    CLIENT_EXPENSE = "Client Expense"
    OTHER = "Other"
