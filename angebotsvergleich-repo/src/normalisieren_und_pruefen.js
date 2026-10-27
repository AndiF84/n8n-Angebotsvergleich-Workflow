// Läuft einmal pro Angebot. Die KI liefert die Rohwerte,
// gerechnet und geprüft wird hier – deterministisch und nachvollziehbar.
const ANFRAGE = {
  id: 'ANF-2026-0417',
  max_lieferzeit_wt: 10,
  positionen: {
    1: { menge: 300, einheit: 'Rolle', name: 'Stretchfolie 500 mm / 23 µm' },
    2: { menge: 5000, einheit: 'Stk', name: 'Kantenschutz 35x35x3' },
  },
};
const r2 = (x) => (x == null || isNaN(x) ? null : Math.round(x * 100) / 100);
const r3 = (x) => (x == null || isNaN(x) ? null : Math.round(x * 1000) / 1000);

const a = $json.output;
const meta = $('PDF-Anhänge aufteilen').item.json;
const warnungen = [];
const abweichungen = [];

// 1) Einzelpreise auf die Einheit der Anfrage umrechnen:
//    Positionsbetrag / angefragte Menge. Damit werden €/kg, €/100 Stk
//    und Staffelpreise automatisch vergleichbar.
const ep = {};
let warenwert = 0;
for (const p of a.positionen || []) {
  const soll = ANFRAGE.positionen[p.anfrage_pos];
  if (!soll || p.gesamtpreis == null) {
    warnungen.push(`Position nicht zuordenbar: ${p.artikel}`);
    continue;
  }
  if (p.menge != null && p.einheit && /rolle|stk|stück/i.test(p.einheit) && p.menge !== soll.menge) {
    abweichungen.push(`Pos. ${p.anfrage_pos}: Menge ${p.menge} statt ${soll.menge}`);
  }
  ep[p.anfrage_pos] = r3(p.gesamtpreis / soll.menge);
  warenwert += p.gesamtpreis;
  if (p.abweichung) abweichungen.push(`Pos. ${p.anfrage_pos}: ${p.abweichung}`);
}

if (a.lieferzeit_werktage != null && a.lieferzeit_werktage > ANFRAGE.max_lieferzeit_wt) {
  abweichungen.push(`Lieferzeit ${a.lieferzeit_werktage} WT > gewünscht ${ANFRAGE.max_lieferzeit_wt} WT`);
} else if (a.lieferzeit_werktage == null) {
  warnungen.push('Keine Lieferzeit angegeben');
}

// 2) Vollständigkeit
const fehlend = Object.keys(ANFRAGE.positionen).map(Number).filter((n) => ep[n] == null);
const vollstaendig = fehlend.length === 0;

// 3) Nebenkosten: Fracht, Pfand, Zuschläge. Erstattbares (z. B. Palettenpfand) separat.
let nebenkosten = 0;
let erstattbar = 0;
for (const n of a.nebenkosten || []) {
  nebenkosten += n.betrag || 0;
  if (n.erstattbar) erstattbar += n.betrag || 0;
}
const summe = r2(warenwert + nebenkosten);

// 4) Plausibilität: Stimmt unsere Rechnung mit der Summe im Angebot überein?
if (a.summe_netto_laut_angebot != null && Math.abs(a.summe_netto_laut_angebot - summe) > 0.05) {
  warnungen.push(`Summe weicht ab: berechnet ${summe} €, laut Angebot ${a.summe_netto_laut_angebot} €`);
}
if (a.anfrage_ref && a.anfrage_ref !== ANFRAGE.id) {
  warnungen.push(`Angebot bezieht sich auf ${a.anfrage_ref}, nicht auf ${ANFRAGE.id}`);
}

return {
  json: {
    anfrage: ANFRAGE.id,
    lieferant: a.lieferant,
    angebotsnr: a.angebotsnr ?? '',
    angebotsdatum: a.angebotsdatum ?? '',
    gueltig_bis: a.gueltig_bis ?? '',
    pos1_ep_normiert: ep[1] ?? null,
    pos2_ep_normiert: ep[2] ?? null,
    warenwert: r2(warenwert),
    nebenkosten: r2(nebenkosten),
    davon_erstattbar: r2(erstattbar),
    summe_netto: summe,
    lieferzeit_wt: a.lieferzeit_werktage ?? null,
    zahlungsziel_tage: a.zahlungsziel_tage ?? null,
    skonto_prozent: a.skonto_prozent ?? 0,
    skonto_tage: a.skonto_tage ?? null,
    vollstaendig,
    fehlende_positionen: fehlend.join(', '),
    abweichungen: abweichungen.join(' | '),
    warnungen: warnungen.join(' | '),
    hinweise: (a.hinweise || []).join(' | '),
    quelle_datei: meta.quelle_datei,
    status: warnungen.length ? 'prüfen' : 'erfasst',
  },
};
