from typing import List

MASTER_SLOTS: List[str] = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00", "18:00",
]


def get_available_slots(booked_slots: List[str]) -> List[str]:
    """Return master slots minus already-booked ones for a given date+service."""
    booked_set = set(booked_slots)
    return [s for s in MASTER_SLOTS if s not in booked_set]
