// Prüft die Rechen- und Bewertungslogik der Code-Nodes ohne n8n.
// Ausführen: node tests/logik.test.js
//
// Simuliert die KI-Ausgabe für die vier Test-PDFs und vergleicht das Ergebnis
// mit testdaten/erwartete_werte.json.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = (f) => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const expected = JSON.parse(fs.readFileSync(path.join(root, 'testdaten', 'erwartete_werte.json'), 'utf8'));

// So sieht die strukturierte KI-Ausgabe für die vier Test-PDFs aus
const kiOutputs = [
  { lieferant: 'Folien Becker KG', angebotsnr: 'AN-88213', anfrage_ref: 'ANF-2026-0417', angebotsdatum: '2026-10-07', gueltig_bis: '2026-11-06',
    positionen: [
      { anfrage_pos: 1, artikel: 'Handstretchfolie 500 mm / 23 µm', menge: 300, einheit: 'Rollen', preis: 6.2, preiseinheit: '€/Rolle', gesamtpreis: 1860, abweichung: null },
      { anfrage_pos: 2, artikel: 'Kantenschutz', menge: 5000, einheit: 'Stk', preis: 0.18, preiseinheit: '€/Stk', gesamtpreis: 900, abweichung: null }],
    nicht_angeboten: [], nebenkosten: [], frei_haus: true, summe_netto_laut_angebot: 2760, lieferzeit_werktage: 5, zahlungsziel_tage: 30, skonto_prozent: 2, skonto_tage: 10, hinweise: [] },
  { lieferant: 'PackTec Solutions GmbH', angebotsnr: 'Q-2026-1102', anfrage_ref: 'ANF-2026-0417', angebotsdatum: '2026-10-08', gueltig_bis: '2026-10-22',
    positionen: [
      { anfrage_pos: 1, artikel: 'Stretch film', menge: 750, einheit: 'kg', preis: 2.35, preiseinheit: '€/kg', gesamtpreis: 1762.5, abweichung: null },
      { anfrage_pos: 2, artikel: 'Kantenschutzwinkel', menge: 5000, einheit: 'Stk', preis: 16, preiseinheit: '€/100 Stk', gesamtpreis: 800, abweichung: null }],
    nicht_angeboten: [], nebenkosten: [{ bezeichnung: 'Frachtpauschale', betrag: 89, erstattbar: false }], frei_haus: false,
    summe_netto_laut_angebot: 2651.5, lieferzeit_werktage: 15, zahlungsziel_tage: 30, skonto_prozent: 0, skonto_tage: null, hinweise: ['nicht ab Lager'] },
  { lieferant: 'Hessen Verpackung Erfundene GmbH & Co. KG', angebotsnr: '2026-511', anfrage_ref: 'ANF-2026-0417', angebotsdatum: '2026-10-09', gueltig_bis: '2026-10-31',
    positionen: [{ anfrage_pos: 1, artikel: 'Handstretchfolie', menge: 300, einheit: 'Rollen', preis: 5.9, preiseinheit: '€/Rolle', gesamtpreis: 1770, abweichung: null }],
    nicht_angeboten: [2], nebenkosten: [], frei_haus: true, summe_netto_laut_angebot: 1770, lieferzeit_werktage: 3, zahlungsziel_tage: 30, skonto_prozent: 3, skonto_tage: 8, hinweise: [] },
  { lieferant: 'EuroWrap Trading Ltd.', angebotsnr: 'EW-77-4410', anfrage_ref: 'ANF-2026-0417', angebotsdatum: '2026-10-10', gueltig_bis: '2026-10-31',
    positionen: [
      { anfrage_pos: 1, artikel: 'Handstretchfolie 20 µm', menge: 300, einheit: 'Rollen', preis: 5.1, preiseinheit: '€/Rolle', gesamtpreis: 1530, abweichung: '20 µm statt 23 µm' },
      { anfrage_pos: 2, artikel: 'Kantenschutz', menge: 5000, einheit: 'Stk', preis: 0.17, preiseinheit: '€/Stk', gesamtpreis: 850, abweichung: null }],
    nicht_angeboten: [], nebenkosten: [{ bezeichnung: 'Europalette Pfand', betrag: 24, erstattbar: true }, { bezeichnung: 'Fracht', betrag: 120, erstattbar: false }],
    frei_haus: false, summe_netto_laut_angebot: 2524, lieferzeit_werktage: 10, zahlungsziel_tage: 14, skonto_prozent: 0, skonto_tage: null, hinweise: ['freibleibend'] },
];

let fehler = 0;
const pruefe = (label, ist, soll) => {
  if (ist !== soll) { fehler++; console.log(`✗ ${label}: ${ist} (erwartet ${soll})`); }
};

// 1) Normalisieren & prüfen (n8n-Modus: einmal pro Item)
const normalisieren = new Function('$json', '$', src('normalisieren_und_pruefen.js'));
const zeilen = kiOutputs.map((o, i) =>
  normalisieren({ output: o }, () => ({ item: { json: { quelle_datei: `test${i}.pdf` } } })).json);

for (const e of expected.angebote) {
  const z = zeilen.find((x) => x.lieferant === e.lieferant);
  pruefe(`${e.lieferant} Summe`, z.summe_netto, e.summe_netto);
  pruefe(`${e.lieferant} Preis Pos. 1`, z.pos1_ep_normiert, e.pos1_preis_rolle);
  pruefe(`${e.lieferant} Preis Pos. 2`, z.pos2_ep_normiert, e.pos2_preis_stk);
  pruefe(`${e.lieferant} vollständig`, z.vollstaendig, e.vollstaendig);
  pruefe(`${e.lieferant} ohne Warnungen`, z.warnungen, '');
}

// 2) Ranking (n8n-Modus: einmal für alle Items)
const ranking = new Function('$input', '$', src('ranking_und_bewertung.js'));
const r = ranking({ all: () => zeilen.map((json, i) => ({ json: { ...json, id: i + 1 } })) },
  () => ({ first: () => ({ json: { anfrage: 'ANF-2026-0417' } }) }))[0].json;
console.log(r.tabelle + '\n');
pruefe('Empfehlung', r.favorit.lieferant, 'Folien Becker KG');
pruefe('Effektive Kosten Empfehlung', r.favorit.effektiv, 2704.8);
pruefe('Nominal günstigstes vollständiges Angebot', r.billigster_nominal, 'EuroWrap Trading Ltd.');

// 3) Vorlage + Protokoll
const vorlage = new Function('$input', '$', src('vorlage_gestalten.js'));
const v = vorlage({ first: () => ({ json: { output: { empfehlung: 'E', begruendung: 'B', abgrenzung: 'A', naechster_schritt: 'N' } } }) },
  () => ({ first: () => ({ json: r }) }))[0].json;
pruefe('Vorlage enthält Rangliste', v.html.includes('EuroWrap'), true);

const protokoll = new Function('$input', '$', src('entscheidung_aufbereiten.js'));
const p = protokoll({ first: () => ({ json: { entscheidung: 'Freigeben', kommentar: '' } }) },
  (name) => ({ first: () => ({ json: name === 'Ranking & Bewertung' ? r : v }) }))[0].json;
pruefe('Protokoll Ergebnis', p.ergebnis, 'freigegeben');

console.log(fehler ? `${fehler} Fehler` : '✓ Alle Prüfungen bestanden');
process.exit(fehler ? 1 : 0);
