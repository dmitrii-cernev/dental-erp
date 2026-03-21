from io import BytesIO
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def build_pdf(visits: list[dict], title: str) -> bytes:
    """Pure function — builds a PDF from a list of visit dicts."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title=title)
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph(title, styles["Title"]))
    story.append(Spacer(1, 0.5 * cm))

    # Table header
    headers = ["Date", "Client", "Doctors", "Services", "Status", "Price"]
    data = [headers]

    total = Decimal("0")
    for v in visits:
        doctors = ", ".join(v.get("doctors", [])) if isinstance(v.get("doctors"), list) else str(v.get("doctors", ""))
        price = Decimal(str(v.get("price", 0)))
        total += price
        data.append([
            str(v.get("date", ""))[:10],
            str(v.get("client", "")),
            doctors,
            str(v.get("services_provided") or ""),
            str(v.get("status", "")),
            f"{price:.2f}",
        ])

    # Totals row
    data.append(["", "", "", "", "TOTAL", f"{total:.2f}"])

    table = Table(data, colWidths=[2.5 * cm, 3 * cm, 3.5 * cm, 4 * cm, 2.5 * cm, 2.5 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4A90D9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.whitesmoke, colors.white]),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.black),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    story.append(table)
    doc.build(story)
    return buffer.getvalue()
