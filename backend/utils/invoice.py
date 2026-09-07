from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
import io
import math

# The PDF base-14 fonts (Helvetica) have no glyph for the Rupee sign (U+20B9),
# so it renders as a blank box. Use an ASCII prefix for all money in the PDF.
RS = "Rs. "

# Company details
COMPANY = {
    "name": "Livnexa Care Private Limited",
    "trade_name": "CryoRevive",
    "tagline": "Elite Recovery & Performance Centre",
    "pan": "AAGCL7757C",
    "cin": "U86909UW2026 PTC 250115",
    "gst": "",  # Add GST number when available
    "address": "Second Floor, B 94, Sector 36",
    "city": "Greater Noida, Uttar Pradesh - 201310",
    "phone": "+91 8595850920",
    "email": "info@cryorevive.in",
    "website": "www.cryorevive.in",
    "sac_code": "999312",
    "gst_rate": 18,
}

SERVICE_NAMES = {
    "ice_bath": "Ice Bath Session",
    "steam_sauna": "Steam Sauna Session",
    "contrast_therapy": "Contrast Therapy",
    "cryo_chamber": "Cryo Chamber Session",
    "compression_therapy": "Compression Therapy",
    "full_body_recovery": "Full Body Recovery",
    "cupping_therapy": "Cupping Therapy",
    "deep_tissue_massage": "Deep Tissue Massage",
    "physiotherapy": "Physiotherapy Session",
    "mobile_unit": "Mobile Recovery Unit",
}


def generate_invoice_pdf(booking: dict, invoice_number: str) -> bytes:
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Colors
    dark_blue = colors.HexColor('#0f172a')
    cyan = colors.HexColor('#06b6d4')
    light_gray = colors.HexColor('#f8fafc')
    mid_gray = colors.HexColor('#64748b')
    red = colors.HexColor('#ef4444')

    # ── HEADER ──────────────────────────────────────────────
    header_data = [[
        # Left: Company info
        Paragraph(
            f'<font size="18" color="#0f172a"><b>Cryo</b></font>'
            f'<font size="18" color="#ef4444"><b>Revive</b></font>',
            ParagraphStyle('brand', fontName='Helvetica-Bold', fontSize=18)
        ),
        # Right: TAX INVOICE
        Paragraph(
            '<font size="14" color="#06b6d4"><b>TAX INVOICE</b></font>',
            ParagraphStyle('inv', fontName='Helvetica-Bold',
                           fontSize=14, alignment=TA_RIGHT)
        ),
    ]]

    header_table = Table(header_data, colWidths=[90*mm, 90*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 2*mm))

    # Company details row
    company_data = [[
        Paragraph(
            f'<font size="9" color="#64748b">'
            f'{COMPANY["name"]}<br/>'
            f'{COMPANY["address"]}<br/>'
            f'{COMPANY["city"]}<br/>'
            f'PAN: {COMPANY["pan"]} | CIN: {COMPANY["cin"]}<br/>'
            f'GST: {COMPANY["gst"] or "Applied For"}<br/>'
            f'Ph: {COMPANY["phone"]} | {COMPANY["email"]}'
            f'</font>',
            ParagraphStyle('comp', fontSize=9, leading=13)
        ),
        Paragraph(
            f'<font size="9" color="#64748b">'
            f'<b>Invoice No:</b> {invoice_number}<br/>'
            f'<b>Invoice Date:</b> {datetime.now().strftime("%d %b %Y")}<br/>'
            f'<b>Service Date:</b> {booking.get("date", "")}<br/>'
            f'<b>Service Time:</b> {booking.get("time_slot", "")}<br/>'
            f'<b>Booking ID:</b> #{str(booking.get("id",""))[:8].upper()}'
            f'</font>',
            ParagraphStyle('inv_details', fontSize=9,
                           leading=13, alignment=TA_RIGHT)
        ),
    ]]

    company_table = Table(company_data, colWidths=[100*mm, 80*mm])
    company_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(company_table)
    story.append(Spacer(1, 4*mm))

    # Divider
    story.append(HRFlowable(
        width="100%", thickness=2,
        color=cyan, spaceAfter=4*mm
    ))

    # ── BILL TO ─────────────────────────────────────────────
    bill_to = Table([[
        Paragraph(
            f'<font size="9" color="#64748b"><b>BILL TO</b></font><br/>'
            f'<font size="11"><b>{booking.get("name", "")}</b></font><br/>'
            f'<font size="9" color="#64748b">'
            f'Phone: {booking.get("phone", "")}<br/>'
            f'Email: {booking.get("email","").replace("@whatsapp.booking","").replace("@staff.booking","")}'
            f'</font>',
            ParagraphStyle('bill', fontSize=9, leading=14)
        ),
        Paragraph(
            f'<font size="9" color="#64748b"><b>PLACE OF SUPPLY</b></font><br/>'
            f'<font size="9">Uttar Pradesh (09)</font><br/><br/>'
            f'<font size="9" color="#64748b"><b>SAC CODE</b></font><br/>'
            f'<font size="9">{COMPANY["sac_code"]}</font>',
            ParagraphStyle('supply', fontSize=9, leading=14, alignment=TA_RIGHT)
        ),
    ]], colWidths=[100*mm, 80*mm])

    bill_to.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_gray),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(bill_to)
    story.append(Spacer(1, 6*mm))

    # ── ITEMS TABLE ──────────────────────────────────────────
    service_name = SERVICE_NAMES.get(
        booking.get("service_type", ""),
        booking.get("service_type", "Recovery Service").replace("_", " ").title()
    )

    # Calculate amounts
    total_amount = booking.get("amount", 0) or 0
    gst_rate = COMPANY["gst_rate"]

    if total_amount > 0:
        taxable_value = round(total_amount / (1 + gst_rate/100), 2)
        gst_amount = round(total_amount - taxable_value, 2)
        cgst = round(gst_amount / 2, 2)
        sgst = round(gst_amount / 2, 2)
    else:
        taxable_value = gst_amount = cgst = sgst = 0

    # Table header + row
    items_data = [
        # Header
        [
            Paragraph('<b>S.No</b>', ParagraphStyle('th', fontSize=9, alignment=TA_CENTER)),
            Paragraph('<b>Description of Service</b>', ParagraphStyle('th', fontSize=9)),
            Paragraph('<b>SAC</b>', ParagraphStyle('th', fontSize=9, alignment=TA_CENTER)),
            Paragraph('<b>Date</b>', ParagraphStyle('th', fontSize=9, alignment=TA_CENTER)),
            Paragraph('<b>Qty</b>', ParagraphStyle('th', fontSize=9, alignment=TA_CENTER)),
            Paragraph('<b>Rate</b>', ParagraphStyle('th', fontSize=9, alignment=TA_RIGHT)),
            Paragraph('<b>Amount</b>', ParagraphStyle('th', fontSize=9, alignment=TA_RIGHT)),
        ],
        # Item row
        [
            Paragraph('1', ParagraphStyle('td', fontSize=9, alignment=TA_CENTER)),
            Paragraph(
                f'{service_name}<br/>'
                f'<font size="8" color="#94a3b8">'
                f'Slot: {booking.get("time_slot","")}'
                f'</font>',
                ParagraphStyle('td', fontSize=9, leading=12)
            ),
            Paragraph(COMPANY["sac_code"],
                      ParagraphStyle('td', fontSize=9, alignment=TA_CENTER)),
            Paragraph(str(booking.get("date", "")),
                      ParagraphStyle('td', fontSize=9, alignment=TA_CENTER)),
            Paragraph('1', ParagraphStyle('td', fontSize=9, alignment=TA_CENTER)),
            Paragraph(f'{RS}{taxable_value:,.2f}',
                      ParagraphStyle('td', fontSize=9, alignment=TA_RIGHT)),
            Paragraph(f'{RS}{taxable_value:,.2f}',
                      ParagraphStyle('td', fontSize=9, alignment=TA_RIGHT)),
        ],
    ]

    col_widths = [12*mm, 60*mm, 18*mm, 22*mm, 12*mm, 22*mm, 24*mm]
    items_table = Table(items_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), dark_blue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        # Rows
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_gray]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 4*mm))

    # ── TOTALS ───────────────────────────────────────────────
    totals_data = [
        ['', '', 'Taxable Value:', f'{RS}{taxable_value:,.2f}'],
        ['', '', f'CGST @ {gst_rate//2}%:', f'{RS}{cgst:,.2f}'],
        ['', '', f'SGST @ {gst_rate//2}%:', f'{RS}{sgst:,.2f}'],
        ['', '', 'Total GST:', f'{RS}{gst_amount:,.2f}'],
        ['', '', 'TOTAL AMOUNT:', f'{RS}{total_amount:,.2f}'],
    ]

    totals_table = Table(
        totals_data,
        colWidths=[50*mm, 50*mm, 50*mm, 30*mm]
    )
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEABOVE', (2, 4), (-1, 4), 1, dark_blue),
        ('FONTNAME', (2, 4), (-1, 4), 'Helvetica-Bold'),
        ('FONTSIZE', (2, 4), (-1, 4), 11),
        ('TEXTCOLOR', (2, 4), (-1, 4), dark_blue),
        ('BACKGROUND', (2, 4), (-1, 4), colors.HexColor('#f0fdf4')),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 4*mm))

    # ── PAYMENT STATUS ──────────────────────────────────────
    payment_status = booking.get("payment_status", "unpaid")
    pay_color = "#16a34a" if payment_status == "paid" else "#dc2626"
    pay_label = "PAID" if payment_status == "paid" else "PAYMENT PENDING"
    pay_method = booking.get("notes", "")

    story.append(Paragraph(
        f'<font size="10" color="{pay_color}"><b>Payment Status: {pay_label}</b></font>',
        ParagraphStyle('pay', fontSize=10)
    ))
    story.append(Spacer(1, 6*mm))

    # ── TERMS & FOOTER ──────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1,
                            color=colors.HexColor('#e2e8f0'),
                            spaceAfter=3*mm))

    terms = [
        "Terms & Conditions:",
        "1. Services once availed are non-refundable.",
        "2. This is a computer-generated invoice and does not require a signature.",
        "3. All disputes subject to Greater Noida jurisdiction.",
        f"4. For queries: {COMPANY['phone']} | {COMPANY['email']}",
    ]
    for i, term in enumerate(terms):
        story.append(Paragraph(
            f'<font size="8" color="#94a3b8">{term}</font>',
            ParagraphStyle('term', fontSize=8, leading=12,
                           fontName='Helvetica-Bold' if i == 0 else 'Helvetica')
        ))

    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=2,
                            color=cyan, spaceAfter=3*mm))
    story.append(Paragraph(
        f'<font size="8" color="#64748b">'
        f'Thank you for choosing CryoRevive | {COMPANY["website"]}'
        f'</font>',
        ParagraphStyle('footer', fontSize=8, alignment=TA_CENTER)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_invoice_number(booking_id: str, date: str) -> str:
    """Generate GST-compliant invoice number"""
    # Format: CRY/2026-27/001234
    year = date[:4] if date else "2026"
    fy_end = int(year) + 1
    short_id = str(booking_id)[:6].upper().replace('-', '')
    return f"CRY/{year}-{str(fy_end)[2:]}/{short_id}"
