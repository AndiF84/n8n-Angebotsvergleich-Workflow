import json, os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
pdfmetrics.registerFont(TTFont("LS","/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("LSB","/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"))
addMapping("LS",0,0,"LS");addMapping("LS",1,0,"LSB");addMapping("LS",0,1,"LS");addMapping("LS",1,1,"LSB")
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "testdaten")
os.makedirs(OUT, exist_ok=True)
ss = getSampleStyleSheet()
N = ParagraphStyle("n", parent=ss["Normal"], fontName="LS", fontSize=9.5, leading=13)
S = ParagraphStyle("s", parent=N, fontSize=8, leading=10, textColor=colors.grey)
H = ParagraphStyle("h", parent=N, fontName="LSB", fontSize=14, leading=18)

KUNDE = "Musterlager GmbH · Einkauf · Industriestraße 12 · 36100 Musterstadt"

def footer(c, d):
    c.saveState(); c.setFont("LS", 7); c.setFillColor(colors.grey)
    c.drawCentredString(A4[0]/2, 10*mm, "Fiktives Testdokument für ein n8n-Portfolio-Projekt – alle Firmen, Personen und Daten sind frei erfunden.")
    c.restoreState()

def build(name, story):
    SimpleDocTemplate(f"{OUT}/{name}", pagesize=A4, leftMargin=20*mm, rightMargin=20*mm,
                      topMargin=18*mm, bottomMargin=20*mm).build(story, onFirstPage=footer, onLaterPages=footer)

def tbl(rows, widths, head_color):
    t = Table(rows, colWidths=[w*mm for w in widths])
    t.setStyle(TableStyle([
        ("FONT", (0,0), (-1,-1), "LS", 9),
        ("FONT", (0,0), (-1,0), "LSB", 9),
        ("BACKGROUND", (0,0), (-1,0), head_color),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), 0.4, colors.HexColor("#999999")),
        ("ALIGN", (2,1), (-1,-1), "RIGHT"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t

def eur(x): return f"{x:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")

P = Paragraph; Sp = lambda h=6: Spacer(1, h)

# ---------- Anfrage ----------
build("00_Anfrage_ANF-2026-0417.pdf", [
    P("Musterlager GmbH", H), P("Industriestraße 12 · 36100 Musterstadt · einkauf@musterlager.example", S), Sp(18),
    P("<b>Angebotsanfrage ANF-2026-0417</b>", N), P("Datum: 05.10.2026 · Angebotsfrist: 12.10.2026", N), Sp(),
    P("Sehr geehrte Damen und Herren,<br/>bitte unterbreiten Sie uns ein Angebot über folgende Positionen, Lieferung frei Haus an obige Adresse:", N), Sp(10),
    tbl([["Pos.", "Artikel", "Menge", "Einheit"],
         ["1", "Handstretchfolie, 500 mm breit, 23 µm, transparent, ca. 2,5 kg/Rolle", "300", "Rollen"],
         ["2", "Kantenschutzecken Pappe, 35 x 35 x 3 mm, Länge 1.000 mm", "5.000", "Stück"]],
        [14, 110, 22, 24], colors.HexColor("#33475b")), Sp(10),
    P("<b>Gewünschte Lieferzeit: spätestens 10 Arbeitstage nach Bestellung.</b>", N), Sp(4),
    P("Bitte geben Sie Lieferzeit, Zahlungsbedingungen, Frachtkosten und Gültigkeit des Angebots an. "
      "Abweichungen von der Spezifikation bitte deutlich kennzeichnen.", N), Sp(),
    P("Mit freundlichen Grüßen<br/>Max Mustermann, Einkauf", N),
])

# ---------- A: sauber, tabellarisch ----------
build("Angebot_Folien-Becker_AN-88213.pdf", [
    P("FOLIEN BECKER KG", ParagraphStyle("x", parent=H, textColor=colors.HexColor("#0b6e4f"))),
    P("Verpackungsfolien seit 1987 · Am Folienwerk 3 · 34000 Beispielhausen", S), Sp(14),
    P(KUNDE, S), Sp(10),
    P("<b>Angebot AN-88213</b> zu Ihrer Anfrage ANF-2026-0417", N),
    P("Angebotsdatum: 07.10.2026 · gültig bis: 06.11.2026", N), Sp(10),
    tbl([["Pos.", "Artikel", "Menge", "Einzelpreis", "Gesamt"],
         ["1", "Handstretchfolie 500 mm / 23 µm, transparent", "300 Rollen", eur(6.20), eur(1860)],
         ["2", "Kantenschutz 35x35x3, L 1000 mm", "5.000 Stk", eur(0.18), eur(900)],
         ["", "Fracht", "", "", "frei Haus"],
         ["", "Summe netto", "", "", eur(2760)]],
        [12, 72, 26, 28, 32], colors.HexColor("#0b6e4f")), Sp(10),
    P("Lieferzeit: 5 Arbeitstage nach Auftragseingang.<br/>"
      "Zahlungsbedingungen: 10 Tage 2 % Skonto, 30 Tage netto.<br/>Alle Preise zzgl. gesetzl. MwSt.", N), Sp(),
    P("Mit freundlichen Grüßen<br/>Sabine Beispiel, Vertriebsinnendienst", N),
])

# ---------- B: Preis pro kg, Fracht extra ----------
build("Angebot_PackTec_Q-2026-1102.pdf", [
    P("PackTec Solutions GmbH", H), P("Logistikpark 7 · 60000 Fiktivstadt · sales@packtec.example", S), Sp(14),
    P(KUNDE, S), Sp(10),
    P("<b>Quotation / Angebot Q-2026-1102</b>", N), P("Ref.: ANF-2026-0417 · Datum 08.10.2026", N), Sp(10),
    tbl([["Pos", "Beschreibung", "Menge", "Preis", "Betrag"],
         ["10", "Stretch film hand 500mm 23my clear\n(Rollengewicht 2,5 kg)", "750 kg", "2,35 €/kg", eur(1762.50)],
         ["20", "Kantenschutzwinkel 35/35/3 L=1000", "5.000 Stk", "16,00 €/100 Stk", eur(800)],
         ["30", "Frachtpauschale Spedition", "1", eur(89), eur(89)],
         ["", "Netto gesamt", "", "", eur(2651.50)]],
        [12, 72, 22, 32, 32], colors.HexColor("#c0392b")), Sp(10),
    P("Lieferung: 2–3 Wochen ab Auftragsbestätigung (Folie derzeit nicht ab Lager).", N),
    P("Zahlung: 30 Tage netto, kein Skonto.", N),
    P("Bindefrist: 14 Tage ab Angebotsdatum.", N), Sp(),
    P("Best regards / Mit freundlichen Grüßen<br/>Tom Fiktiv, Key Account", N),
])

# ---------- C: Briefstil, Staffelpreis, Teilangebot ----------
build("Angebot_Hessen-Verpackung_2026-511.pdf", [
    P("Hessen Verpackung Erfundene GmbH & Co. KG", H), P("Kartonweg 21 · 35000 Testdorf", S), Sp(14),
    P(KUNDE, S), Sp(10),
    P("Testdorf, 09.10.2026<br/><b>Ihre Anfrage ANF-2026-0417 – unser Angebot Nr. 2026-511</b>", N), Sp(),
    P("Sehr geehrter Herr Mustermann,", N), Sp(4),
    P("vielen Dank für Ihre Anfrage. Gerne bieten wir Ihnen die Handstretchfolie 500 mm, 23 µm, transparent "
      "(Rollengewicht ca. 2,5 kg) wie folgt an: Bis 199 Rollen berechnen wir 6,40 € pro Rolle, ab 200 Rollen "
      "reduziert sich der Preis auf 5,90 € pro Rolle. Bei Ihrer Menge von 300 Rollen ergibt sich somit ein "
      "Warenwert von 1.770,00 € netto.", N), Sp(4),
    P("Kantenschutzecken führen wir leider nicht mehr im Sortiment, Position 2 können wir daher nicht anbieten.", N), Sp(4),
    P("Die Lieferung erfolgt ab einem Warenwert von 1.000 € frei Haus, Lieferzeit ca. 3 Arbeitstage, da die Ware "
      "an unserem Lager in Testdorf vorrätig ist. Zahlbar innerhalb von 8 Tagen mit 3 % Skonto oder 30 Tage netto. "
      "Dieses Angebot ist gültig bis zum 31.10.2026.", N), Sp(),
    P("Wir würden uns über Ihren Auftrag freuen.<br/>Mit freundlichen Grüßen<br/>Petra Erfunden", N),
])

# ---------- D: billigste, aber Spezifikationsabweichung ----------
build("Angebot_EuroWrap_EW-77-4410.pdf", [
    P("EuroWrap Trading Ltd. – Niederlassung Deutschland", H), P("Hafenstraße 99 · 20000 Musterhafen", S), Sp(14),
    P(KUNDE, S), Sp(10),
    P("<b>ANGEBOT EW-77-4410</b> · 10.10.2026 · Ihr Zeichen: ANF-2026-0417", N), Sp(10),
    tbl([["Pos.", "Artikel", "Menge", "EP", "GP"],
         ["1", "Handstretchfolie 500 mm, 20 µm* (Pre-Stretch)", "300 Rollen", eur(5.10), eur(1530)],
         ["2", "Kantenschutz 35x35x3, L 1000 mm", "5.000 Stk", eur(0.17), eur(850)],
         ["3", "Europalette (Tauschpalette / Pfand)", "2", eur(12), eur(24)],
         ["4", "Fracht", "1", eur(120), eur(120)],
         ["", "Gesamt netto", "", "", eur(2524)]],
        [12, 74, 24, 28, 32], colors.HexColor("#1f4e9c")), Sp(8),
    P("* Alternativangebot: Statt 23 µm bieten wir eine vorgereckte 20-µm-Folie an, die laut Hersteller eine "
      "vergleichbare Haltekraft erreicht. Die 23-µm-Variante ist derzeit nicht lieferbar.", S), Sp(8),
    P("Lieferzeit: 10 Werktage. Zahlung: 14 Tage netto. Angebot freibleibend, gültig 21 Tage.", N),
    P("Paletten werden bei Rückgabe im Tausch gutgeschrieben.", N), Sp(),
    P("Mit freundlichen Grüßen<br/>J. Platzhalter, Sales", N),
])

# ---------- Erwartete Werte (Prüfdatei) ----------
expected = {
  "anfrage": "ANF-2026-0417",
  "hinweis": "Soll-Werte zum Testen der KI-Extraktion. Preise netto in EUR.",
  "angebote": [
    {"lieferant": "Folien Becker KG", "angebotsnr": "AN-88213", "datum": "2026-10-07", "gueltig_bis": "2026-11-06",
     "pos1_preis_rolle": 6.20, "pos2_preis_stk": 0.18, "fracht": 0.0, "nebenkosten": 0.0, "summe_netto": 2760.00,
     "lieferzeit_tage": 5, "zahlung": "10 Tage 2 % Skonto, 30 Tage netto", "skonto_prozent": 2.0,
     "vollstaendig": True, "abweichungen": []},
    {"lieferant": "PackTec Solutions GmbH", "angebotsnr": "Q-2026-1102", "datum": "2026-10-08", "gueltig_bis": "2026-10-22",
     "pos1_preis_rolle": 5.875, "pos2_preis_stk": 0.16, "fracht": 89.0, "nebenkosten": 0.0, "summe_netto": 2651.50,
     "lieferzeit_tage": 15, "zahlung": "30 Tage netto", "skonto_prozent": 0.0,
     "vollstaendig": True, "abweichungen": ["Preis pro kg statt pro Rolle", "Preis Pos. 2 pro 100 Stück", "Lieferzeit 2–3 Wochen (max. 15 Werktage) überschreitet die gewünschten 10 Arbeitstage"]},
    {"lieferant": "Hessen Verpackung Erfundene GmbH & Co. KG", "angebotsnr": "2026-511", "datum": "2026-10-09", "gueltig_bis": "2026-10-31",
     "pos1_preis_rolle": 5.90, "pos2_preis_stk": None, "fracht": 0.0, "nebenkosten": 0.0, "summe_netto": 1770.00,
     "lieferzeit_tage": 3, "zahlung": "8 Tage 3 % Skonto, 30 Tage netto", "skonto_prozent": 3.0,
     "vollstaendig": False, "abweichungen": ["Pos. 2 nicht angeboten (Teilangebot)", "Staffelpreis: 6,40 €/Rolle bis 199, 5,90 € ab 200"]},
    {"lieferant": "EuroWrap Trading Ltd.", "angebotsnr": "EW-77-4410", "datum": "2026-10-10", "gueltig_bis": "2026-10-31",
     "pos1_preis_rolle": 5.10, "pos2_preis_stk": 0.17, "fracht": 120.0, "nebenkosten": 24.0, "summe_netto": 2524.00,
     "lieferzeit_tage": 10, "zahlung": "14 Tage netto", "skonto_prozent": 0.0,
     "vollstaendig": True, "abweichungen": ["Spezifikation: 20 µm statt 23 µm (Alternativangebot)", "Palettenpfand 24 € (bei Rückgabe gutgeschrieben)", "Angebot freibleibend"]}
  ],
  "erwartete_empfehlung": "Folien Becker KG: einziges vollständiges Angebot, das Spezifikation und Lieferfrist erfüllt (frei Haus, 5 AT, effektiv 2.704,80 € nach 2 % Skonto). EuroWrap ist nominal günstiger, weicht aber bei der Folienstärke ab; PackTec überschreitet die Lieferfrist; Hessen Verpackung ist nur ein Teilangebot."
}
json.dump(expected, open(f"{OUT}/erwartete_werte.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("ok")
