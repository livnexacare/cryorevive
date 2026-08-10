from typing import List

# Fallback used only if the custom_slots table is empty/unreachable.
MASTER_SLOTS: List[str] = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00", "18:00",
]
