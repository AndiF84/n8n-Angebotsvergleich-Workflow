// Regelbasiertes Ranking. Die KI begründet danach nur noch –
// sie entscheidet nicht. So bleibt die Bewertung prüfbar.
const start = $('Vergleich starten').first().json;
const anfrage = (start.anfrage ?? start['Anfrage-Nr.'] ?? '').trim();
const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));
const bool = (v) => v === true || String(v).toUpperCase() === 'TRUE';
const heute = new Date().toISOString().slice(0, 10);

// Pro Lieferant + Angebotsnummer nur den neuesten Eintrag nehmen (falls ein Angebot mehrfach hochgeladen wurde)
const neueste = {};
for (const r of $input.all().map((i) => i.json)) {
  if (r.anfrage !== anfrage) continue;
  const key = `${r.lieferant}|${r.angebotsnr}`;
  if (!neueste[key] || String(r.createdAt ?? r.id) > String(neueste[key].createdAt ?? neueste[key].id)) neueste[key] = r;
}
const angebote = Object.values(neueste);
if (!angebote.length) throw new Error(`Keine Angebote zu ${anfrage} gefunden. Erst Workflow 1 ausführen.`);

const KATEGORIEN = {
  empfehlbar: 'vollständig und nach Spezifikation',
  rueckfrage: 'vollständig, aber Abweichung (Spezifikation/Lieferzeit) – Rückfrage nötig',
  teilangebot: 'unvollständig (Teilangebot)',
  abgelaufen: 'Angebot abgelaufen',
};
const ORDER = ['empfehlbar', 'rueckfrage', 'teilangebot', 'abgelaufen'];

const bewertet = angebote.map((r) => {
  const summe = num(r.summe_netto) ?? 0;
  const erstattbar = num(r.davon_erstattbar) ?? 0;
  const skonto = num(r.skonto_prozent) ?? 0;
  // Effektive Kosten: ohne erstattbares Pfand, abzüglich Skonto
  const effektiv = Math.round((summe - erstattbar) * (1 - skonto / 100) * 100) / 100;
  let kategorie = 'empfehlbar';
  if (r.gueltig_bis && r.gueltig_bis < heute) kategorie = 'abgelaufen';
  else if (!bool(r.vollstaendig)) kategorie = 'teilangebot';
  else if (r.abweichungen) kategorie = 'rueckfrage';
  return {
    lieferant: r.lieferant,
    angebotsnr: r.angebotsnr,
    summe_netto: summe,
    effektiv,
    skonto_prozent: skonto,
    lieferzeit_wt: num(r.lieferzeit_wt),
    zahlungsziel_tage: num(r.zahlungsziel_tage),
    gueltig_bis: r.gueltig_bis,
    kategorie,
    kategorie_text: KATEGORIEN[kategorie],
    abweichungen: r.abweichungen || '',
    fehlende_positionen: r.fehlende_positionen || '',
    warnungen: r.warnungen || '',
  };
});

bewertet.sort(
  (x, y) =>
    ORDER.indexOf(x.kategorie) - ORDER.indexOf(y.kategorie) ||
    x.effektiv - y.effektiv ||
    (x.lieferzeit_wt ?? 99) - (y.lieferzeit_wt ?? 99)
);
bewertet.forEach((b, i) => (b.rang = i + 1));

const favorit = bewertet[0];
// Nominal günstigstes Angebot – nur vollständige zählen, sonst hinkt der Vergleich
const vergleichbar = bewertet.filter((b) => b.kategorie !== 'teilangebot');
const billigster = [...(vergleichbar.length ? vergleichbar : bewertet)].sort((x, y) => x.summe_netto - y.summe_netto)[0];
const eur = (x) => x.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const tabelle = bewertet
  .map(
    (b) =>
      `${b.rang}. ${b.lieferant} – ${eur(b.summe_netto)} netto (effektiv ${eur(b.effektiv)}), ` +
      `${b.lieferzeit_wt ?? '?'} WT, ${b.kategorie_text}` +
      (b.abweichungen ? ` [${b.abweichungen}]` : '') +
      (b.fehlende_positionen ? ` [fehlt: Pos. ${b.fehlende_positionen}]` : '') +
      (b.warnungen ? ` ⚠ ${b.warnungen}` : '')
  )
  .join('\n');

const farbe = { empfehlbar: '#1a7f37', rueckfrage: '#9a6700', teilangebot: '#cf222e', abgelaufen: '#6e7781' };
const tabelle_html =
  '<table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left">' +
  '<tr style="border-bottom:2px solid #ccc"><th>#</th><th>Lieferant</th><th>Netto</th><th>Effektiv</th><th>Lieferzeit</th><th>Bewertung</th></tr>' +
  bewertet
    .map(
      (b) =>
        `<tr style="border-bottom:1px solid #eee;${b.rang === 1 ? 'font-weight:bold' : ''}"><td>${b.rang}</td><td>${b.lieferant}</td>` +
        `<td>${eur(b.summe_netto)}</td><td>${eur(b.effektiv)}</td><td>${b.lieferzeit_wt ?? '?'} AT</td>` +
        `<td style="color:${farbe[b.kategorie]}">${b.kategorie_text}` +
        (b.abweichungen ? `<br><small>${b.abweichungen}</small>` : '') +
        (b.fehlende_positionen ? `<br><small>fehlt: Pos. ${b.fehlende_positionen}</small>` : '') +
        `</td></tr>`
    )
    .join('') +
  '</table><p><small>Effektiv = netto ohne erstattbares Pfand, abzüglich Skonto.</small></p>';

return [
  {
    json: {
      anfrage,
      tabelle_html,
      anzahl_angebote: bewertet.length,
      favorit,
      billigster_nominal: billigster.lieferant,
      favorit_ist_nicht_billigster: billigster.lieferant !== favorit.lieferant,
      rangliste: bewertet,
      tabelle,
    },
  },
];
