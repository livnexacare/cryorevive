"""Server-side GST tax-invoice PDF for CryoRevive.

Rendered with the reportlab low-level canvas so the layout matches the
CryoRevive brand template (dark header band, TAX INVOICE title, Bill-To +
Supplier-GST panels, SKU line-items, amount-in-words, cyan total bar,
signatory block, footer).

Note: the PDF base-14 Helvetica has no Rupee glyph (U+20B9) and no emoji,
so money is labelled "Rs." and icon glyphs are dropped in favour of text.
"""

import io
import re
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# ── Company / brand ────────────────────────────────────────────────────────
COMPANY = {
    "name": "Livnexa Care Pvt. Ltd.",
    "brand": "CryoRevive",
    "tagline": "RECOVERY AND WELLNESS CENTRE",
    "pan": "AAGCL7757C",
    "cin": "U86909UW2026 PTC 250115",
    "gstin": "09AAGCL7757C1Z9",
    "address": "Second Floor, B 94, Sector 36",
    "city": "Greater Noida, Uttar Pradesh - 201310",
    "phone": "+91 8595850920",
    "email": "info@cryorevive.in",
    "website": "www.cryorevive.in",
    "sac_code": "999312",
    "gst_rate": 18,
    "signatory": "Ankit Singh",
}

# ── Service catalogue with SKUs ───────────────────────────────────────────
SERVICES = {
    "ice_bath":            {"name": "Cold Plunge Recovery Session",  "sku": "CR-CP-001", "sac_code": "999312"},
    "steam_sauna":         {"name": "Steam Sauna Session",           "sku": "CR-SS-001", "sac_code": "999312"},
    "contrast_therapy":    {"name": "Contrast Therapy Session",      "sku": "CR-CT-001", "sac_code": "999312"},
    "cryo_chamber":        {"name": "Cryotherapy Session",           "sku": "CR-CY-001", "sac_code": "999312"},
    "compression_therapy": {"name": "Compression Recovery Session",  "sku": "CR-CM-001", "sac_code": "999312"},
    "full_body_recovery":  {"name": "Full Body Recovery Session",    "sku": "CR-FB-001", "sac_code": "999312"},
    "cupping_therapy":     {"name": "Cupping Therapy Session",       "sku": "CR-CU-001", "sac_code": "999312"},
    "deep_tissue_massage": {"name": "Recovery Massage",              "sku": "CR-MG-001", "sac_code": "999312"},
    # Note: verify GST treatment of physiotherapy with the CA.
    "physiotherapy":       {"name": "Physiotherapy Session",        "sku": "CR-PT-001", "sac_code": "999312"},
    "mobile_unit":         {"name": "Mobile Recovery Unit",         "sku": "CR-MU-001", "sac_code": "999312"},
}

_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
         "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
         "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
         "Eighty", "Ninety"]


def _convert(n: int) -> str:
    if n == 0:
        return ""
    if n < 20:
        return _ONES[n] + " "
    if n < 100:
        return _TENS[n // 10] + " " + _ONES[n % 10] + " "
    if n < 1000:
        return _ONES[n // 100] + " Hundred " + _convert(n % 100)
    if n < 100000:
        return _convert(n // 1000) + "Thousand " + _convert(n % 1000)
    if n < 10000000:
        return _convert(n // 100000) + "Lakh " + _convert(n % 100000)
    return _convert(n // 10000000) + "Crore " + _convert(n % 10000000)


def number_to_words(amount: float) -> str:
    rupees = int(amount)
    paise = round((amount - rupees) * 100)
    result = "Rupees " + _convert(rupees).strip()
    if paise > 0:
        result += " and " + _convert(paise).strip() + " Paise"
    return (result + " Only").replace("  ", " ")


def _inr(n: float) -> str:
    """Indian digit grouping with two decimals, e.g. 123456.5 -> '1,23,456.50'."""
    n = float(n)
    neg = n < 0
    n = abs(n)
    whole = int(n)
    dec = round((n - whole) * 100)
    if dec == 100:
        whole += 1
        dec = 0
    s = str(whole)
    if len(s) > 3:
        last3, rest = s[-3:], s[:-3]
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        s = ",".join(groups) + "," + last3
    return ("-" if neg else "") + s + "." + f"{dec:02d}"


class _P:
    """Thin canvas wrapper working in top-down millimetre coordinates."""

    PW, PH = 210.0, 297.0

    def __init__(self, c: canvas.Canvas):
        self.c = c

    def _ty(self, top: float) -> float:
        return (self.PH - top) * mm

    def box(self, x, top, w, h, fill=None, stroke=None, lw=0.3):
        if fill:
            self.c.setFillColor(colors.HexColor(fill))
        if stroke:
            self.c.setStrokeColor(colors.HexColor(stroke))
            self.c.setLineWidth(lw * mm)
        self.c.rect(x * mm, (self.PH - top - h) * mm, w * mm, h * mm,
                    stroke=1 if stroke else 0, fill=1 if fill else 0)

    def circle(self, cx, cy, r, fill):
        self.c.setFillColor(colors.HexColor(fill))
        self.c.circle(cx * mm, self._ty(cy), r * mm, stroke=0, fill=1)

    def line(self, x1, y1, x2, y2, color="#0f172a", lw=0.5):
        self.c.setStrokeColor(colors.HexColor(color))
        self.c.setLineWidth(lw * mm)
        self.c.line(x1 * mm, self._ty(y1), x2 * mm, self._ty(y2))

    def text(self, x, top, s, size=9, bold=False, italic=False,
             color="#0f172a", align="left"):
        if bold and italic:
            font = "Helvetica-BoldOblique"
        elif bold:
            font = "Helvetica-Bold"
        elif italic:
            font = "Helvetica-Oblique"
        else:
            font = "Helvetica"
        self.c.setFont(font, size)
        self.c.setFillColor(colors.HexColor(color))
        xp, yp = x * mm, self._ty(top)
        if align == "right":
            self.c.drawRightString(xp, yp, s)
        elif align == "center":
            self.c.drawCentredString(xp, yp, s)
        else:
            self.c.drawString(xp, yp, s)

    def text_width(self, s, size, bold=False) -> float:
        return self.c.stringWidth(
            s, "Helvetica-Bold" if bold else "Helvetica", size) / mm


def generate_invoice_pdf(booking: dict, invoice_number: str) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    p = _P(c)

    M = 12.0
    W = 210.0
    content_w = W - M * 2

    total = booking.get("amount") or 0
    gst_rate = COMPANY["gst_rate"]
    taxable = round(total / (1 + gst_rate / 100), 2)
    gst_amt = round(total - taxable, 2)
    cgst = round(gst_amt / 2, 2)
    sgst = round(gst_amt / 2, 2)

    today = datetime.now().strftime("%d %b %Y")

    svc = SERVICES.get(booking.get("service_type") or "")
    if not svc:
        raw = booking.get("service_type") or ""
        svc = {
            "name": raw.replace("_", " ").title() if raw else "Recovery Service",
            "sku": "CR-GEN-001",
            "sac_code": COMPANY["sac_code"],
        }

    clean_phone = re.sub(r"\D", "", booking.get("phone") or "")[-10:]
    clean_email = (booking.get("email") or "") \
        .replace("@whatsapp.booking", "").replace("@staff.booking", "")

    # ── DARK HEADER BAND ─────────────────────────────────────────────────
    p.box(0, 0, W, 42, fill="#0f172a")
    p.circle(22, 16, 8, fill="#06b6d4")
    p.circle(25, 13, 4, fill="#ef4444")

    p.text(32, 18, "Cryo", size=20, bold=True, color="#ffffff")
    cryo_w = p.text_width("Cryo", 20, bold=True)
    p.text(32 + cryo_w, 18, "Revive", size=20, bold=True, color="#06b6d4")
    p.text(32, 23, "- " + COMPANY["tagline"] + " -", size=7, color="#94a3b8")

    for i, t in enumerate(["RECOVER", "RECHARGE", "PERFORM", "BETTER"]):
        p.text(105, 10 + i * 7, t, size=8, color="#94a3b8", align="center")
    for i, t in enumerate(["A", "HEALTHIER", "STRONGER", "YOU"]):
        p.text(W - 30, 10 + i * 7, t, size=9, bold=True, color="#ffffff", align="center")

    p.box(0, 38, W, 1.5, fill="#06b6d4")

    # ── TAX INVOICE TITLE + COMPANY INFO ────────────────────────────────
    p.text(M, 52, "TAX INVOICE", size=28, bold=True, color="#06b6d4")

    p.text(M, 60, COMPANY["name"], size=10, bold=True, color="#0f172a")
    p.text(M, 65, f"(Brand: {COMPANY['brand']})", size=8, color="#64748b")
    p.text(M, 70, COMPANY["address"] + ",", size=8, color="#64748b")
    p.text(M, 74, COMPANY["city"], size=8, color="#64748b")
    p.text(M, 78, f"Ph: {COMPANY['phone']}", size=8, color="#64748b")
    p.text(M, 82, f"Email: {COMPANY['email']}", size=8, color="#64748b")
    p.text(M, 86, f"Web: {COMPANY['website']}", size=8, color="#64748b")
    p.text(M, 90, f"PAN: {COMPANY['pan']}  |  CIN: {COMPANY['cin']}", size=7, color="#94a3b8")

    # Invoice details box (right)
    box_x = 120.0
    box_w = W - box_x - M
    p.box(box_x, 48, box_w, 36, fill="#f8fafc", stroke="#e2e8f0", lw=0.3)
    label_x = box_x + 3
    val_x = box_x + box_w - 3
    inv_rows = [
        ("Invoice No.", invoice_number, True),
        ("Invoice Date", today, False),
        ("Due Date", today, False),
        ("Payment Terms", "Due on Receipt", False),
        ("Place of Supply", "Uttar Pradesh (09)", False),
    ]
    for i, (label, value, hl) in enumerate(inv_rows):
        ry = 54 + i * 6
        p.text(label_x, ry, label, size=8, color="#64748b")
        p.text(label_x + 26, ry, ":", size=8, color="#64748b")
        p.text(val_x, ry, str(value), size=8, bold=hl,
               color="#06b6d4" if hl else "#0f172a", align="right")

    # ── BILL TO + GST DETAILS ──────────────────────────────────────────
    y = 96.0
    half_w = (content_w - 4) / 2

    p.box(M, y, half_w, 36, fill="#eff6ff", stroke="#93c5fd", lw=0.3)
    p.text(M + 3, y + 6, "BILL TO", size=8, bold=True, color="#2563eb")
    p.text(M + 3, y + 13, booking.get("name") or "", size=10, bold=True, color="#0f172a")
    cy = y + 19
    if clean_phone:
        p.text(M + 3, cy, f"+91 {clean_phone}", size=8, color="#475569")
        cy += 4
    if clean_email and "whatsapp" not in clean_email and "staff" not in clean_email:
        p.text(M + 3, cy, clean_email, size=8, color="#475569")
        cy += 4
    notes = booking.get("notes") or ""
    if notes and "Staff booking" not in notes:
        p.text(M + 3, cy, notes[:40], size=8, color="#475569")

    gst_x = M + half_w + 4
    p.box(gst_x, y, half_w, 36, fill="#eff6ff", stroke="#93c5fd", lw=0.3)
    p.text(gst_x + 3, y + 6, "GST DETAILS (SUPPLIER)", size=8, bold=True, color="#2563eb")
    gst_rows = [
        ("Company Name", COMPANY["name"]),
        ("Brand", COMPANY["brand"]),
        ("GSTIN", COMPANY["gstin"]),
        ("Address", COMPANY["address"]),
    ]
    for i, (label, value) in enumerate(gst_rows):
        gy = y + 13 + i * 6
        p.text(gst_x + 3, gy, f"{label} :", size=8, color="#64748b")
        disp = value if len(value) <= 22 else value[:22] + "..."
        p.text(gst_x + 32, gy, disp, size=8, bold=(i == 2), color="#0f172a")

    # ── ITEMS TABLE ────────────────────────────────────────────────────
    y = 140.0
    col_no = M
    col_desc = M + 8
    col_sku = M + 80
    col_sac = M + 105
    col_qty = M + 122
    col_rate = M + 137
    col_amt = W - M

    p.box(M, y, content_w, 8, fill="#0f172a")
    hy = y + 5
    p.text(col_no + 2, hy, "#", size=8, bold=True, color="#ffffff")
    p.text(col_desc, hy, "Service Description", size=8, bold=True, color="#ffffff")
    p.text(col_sku, hy, "SKU", size=8, bold=True, color="#ffffff")
    p.text(col_sac, hy, "SAC", size=8, bold=True, color="#ffffff")
    p.text(col_qty, hy, "Qty", size=8, bold=True, color="#ffffff")
    p.text(col_rate, hy, "Rate (Rs.)", size=8, bold=True, color="#ffffff")
    p.text(col_amt, hy, "Amount (Rs.)", size=8, bold=True, color="#ffffff", align="right")

    y += 8
    p.box(M, y, content_w, 14, fill="#f9fafb", stroke="#e2e8f0", lw=0.3)
    p.text(col_no + 2, y + 6, "1", size=9, color="#0f172a")
    p.text(col_desc, y + 6, svc["name"], size=9, color="#0f172a")
    p.text(col_desc, y + 11,
           f"Session: {booking.get('date') or ''} {booking.get('time_slot') or ''}".strip(),
           size=7, color="#64748b")
    p.text(col_sku, y + 6, svc["sku"], size=8, color="#0f172a")
    p.text(col_sac, y + 6, svc["sac_code"], size=8, color="#0f172a")
    p.text(col_qty, y + 6, "1", size=8, color="#0f172a")
    p.text(col_rate, y + 6, _inr(taxable), size=8, color="#0f172a")
    p.text(col_amt, y + 6, _inr(taxable), size=8, color="#0f172a", align="right")

    y += 16

    # ── THANK YOU + TOTALS ─────────────────────────────────────────────
    thank_x = M
    thank_w = 70.0
    tot_x = M + thank_w + 4
    tot_w = content_w - thank_w - 4

    p.text(thank_x + 5, y + 12, "Thank you", size=16, bold=True, italic=True, color="#06b6d4")
    p.text(thank_x + 5, y + 20, "for choosing", size=16, bold=True, italic=True, color="#06b6d4")
    p.text(thank_x + 5, y + 28, "CryoRevive!", size=16, bold=True, italic=True, color="#06b6d4")

    tot_rows = [
        ("Subtotal", _inr(taxable)),
        (f"CGST @ {gst_rate / 2:g}%", _inr(cgst)),
        (f"SGST @ {gst_rate / 2:g}%", _inr(sgst)),
    ]
    for i, (label, val) in enumerate(tot_rows):
        ty = y + 6 + i * 8
        p.text(tot_x + 3, ty, label, size=9, color="#475569")
        p.text(W - M - 3, ty, val, size=9, color="#0f172a", align="right")

    total_y = y + 30
    p.box(tot_x, total_y - 5, tot_w, 10, fill="#06b6d4")
    p.text(tot_x + 3, total_y + 1, "Total Amount (Rs.)", size=10, bold=True, color="#ffffff")
    p.text(W - M - 3, total_y + 1, _inr(total), size=10, bold=True, color="#ffffff", align="right")

    # ── AMOUNT IN WORDS ────────────────────────────────────────────────
    y = y + 44
    p.text(M, y, "Amount in Words:", size=8, bold=True, color="#2563eb")
    p.text(M, y + 5, number_to_words(total), size=8, color="#0f172a")

    # ── CUSTOMER NOTES + TERMS ─────────────────────────────────────────
    y += 13
    p.box(M, y, half_w, 26, fill="#eff6ff", stroke="#93c5fd", lw=0.3)
    p.text(M + 3, y + 6, "Customer Notes", size=8, bold=True, color="#2563eb")
    p.text(M + 3, y + 13, "Thank you for choosing CryoRevive.", size=8, color="#475569")
    p.text(M + 3, y + 18, "We look forward to supporting your", size=8, color="#475569")
    p.text(M + 3, y + 23, "recovery and wellness journey.", size=8, color="#475569")

    terms_x = M + half_w + 4
    p.box(terms_x, y, half_w, 26, fill="#eff6ff", stroke="#93c5fd", lw=0.3)
    p.text(terms_x + 3, y + 6, "Terms & Conditions", size=8, bold=True, color="#2563eb")
    for i, t in enumerate([
        "1. Payment is due on receipt.",
        "2. Services subject to cancellation policy.",
        "3. GST as per prevailing regulations.",
        "4. Computer generated invoice.",
    ]):
        p.text(terms_x + 3, y + 12 + i * 4.5, t, size=7.5, color="#475569")

    # ── SIGNATURE ─────────────────────────────────────────────────────
    y += 32
    sig_x = W - M - 45
    p.text(sig_x, y, "For " + COMPANY["name"], size=9, bold=True, color="#0f172a")
    p.text(sig_x + 10, y + 6, COMPANY["signatory"], size=8, color="#0f172a")
    p.line(sig_x, y + 9, W - M, y + 9, color="#0f172a", lw=0.5)
    p.text(sig_x, y + 13, "Authorized Signatory", size=8, bold=True, color="#64748b")

    # ── FOOTER ────────────────────────────────────────────────────────
    footer_y = 272.0
    p.box(0, footer_y, W, 24, fill="#f8fafc")
    p.text(M, footer_y + 8, "Follow Us", size=8, bold=True, color="#0f172a")
    p.text(M, footer_y + 14, "@cryorevive", size=8, color="#2563eb")
    p.text(W / 2, footer_y + 8, "RECOVERY TODAY", size=9, bold=True, color="#0f172a", align="center")
    p.text(W / 2, footer_y + 14, "A STRONGER TOMORROW", size=9, bold=True, color="#0f172a", align="center")
    p.text(W - M, footer_y + 11, COMPANY["website"], size=8, bold=True, color="#06b6d4", align="right")
    p.box(0, 293, W, 4, fill="#06b6d4")

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


def generate_invoice_number(booking_id: str, date: str) -> str:
    """Deterministic GST-style invoice number derived from the booking id.

    Format: CR/26-27/XXXXXX  (financial-year prefix + short id).

    Stateless and stable per booking. A truly sequential per-FY series
    would need a persisted counter (DB sequence/table).
    """
    year = date[:4] if date else "2026"
    try:
        fy_start = int(year)
    except ValueError:
        fy_start = 2026
    short_id = str(booking_id).replace("-", "")[:6].upper()
    return f"CR/{str(fy_start)[2:]}-{str(fy_start + 1)[2:]}/{short_id}"
