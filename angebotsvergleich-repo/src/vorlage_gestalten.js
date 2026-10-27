// Baut aus Ranking + KI-Begründung eine gut lesbare Entscheidungsvorlage (HTML für die Formularseite).
const r = $('Ranking & Bewertung').first().json;
const k = $input.first().json.output || {};
const f = r.favorit;

const eur = (x) => (x ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BADGE = {
  empfehlbar: ['#dafbe1', '#1a7f37', 'Empfohlen'],
  rueckfrage: ['#fff8c5', '#9a6700', 'Rückfrage nötig'],
  teilangebot: ['#ffebe9', '#cf222e', 'Teilangebot'],
  abgelaufen: ['#eaeef2', '#57606a', 'Abgelaufen'],
};
const badge = (kat) => {
  const [bg, fg, label] = BADGE[kat] || BADGE.abgelaufen;
  return `<span style="display:inline-block;background:${bg};color:${fg};border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600;white-space:nowrap">${label}</span>`;
};

const kpi = (label, value, sub = '') =>
  `<div style="flex:1 1 160px;background:#f6f8fa;border:1px solid #d0d7de;border-radius:10px;padding:12px 14px">` +
  `<div style="font-size:11px;color:#57606a;text-transform:uppercase;letter-spacing:.05em">${label}</div>` +
  `<div style="font-size:19px;font-weight:700;margin-top:4px;line-height:1.25">${value}</div>` +
  (sub ? `<div style="font-size:12px;color:#57606a;margin-top:3px">${sub}</div>` : '') +
  `</div>`;

const kpis =
  `<div style="display:flex;flex-wrap:wrap;gap:10px;margin:4px 0 18px">` +
  kpi('Empfehlung', esc(f.lieferant), 'Angebot ' + esc(f.angebotsnr)) +
  kpi('Effektive Kosten', eur(f.effektiv), eur(f.summe_netto) + ' netto') +
  kpi('Lieferzeit', `${f.lieferzeit_wt ?? '?'} Arbeitstage`) +
  kpi('Verglichen', `${r.anzahl_angebote} Angebote`) +
  `</div>`;

const abschnitt = (titel, text) =>
  text
    ? `<div style="margin:0 0 12px"><div style="font-weight:700;margin-bottom:3px">${titel}</div>` +
      `<div style="line-height:1.6">${esc(text)}</div></div>`
    : '';

const begruendung =
  `<div style="border-left:4px solid #0969da;background:#f0f6ff;border-radius:8px;padding:14px 18px;margin-bottom:20px">` +
  `<div style="font-size:11px;color:#0969da;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">KI-Begründung</div>` +
  abschnitt('Warum ' + esc(f.lieferant), k.begruendung) +
  abschnitt('Abgrenzung zu den Alternativen', k.abgrenzung) +
  abschnitt('Nächster Schritt', k.naechster_schritt) +
  `</div>`;

const th = (t, align = 'left') => `<th style="padding:8px 10px;text-align:${align};font-size:12px;color:#57606a;font-weight:600">${t}</th>`;
const td = (t, align = 'left', extra = '') => `<td style="padding:10px;text-align:${align};vertical-align:top;${extra}">${t}</td>`;

const zeilen = r.rangliste
  .map((b) => {
    const details = [b.abweichungen, b.fehlende_positionen ? 'fehlt: Pos. ' + b.fehlende_positionen : '', b.warnungen]
      .filter(Boolean)
      .map((d) => `<div style="font-size:12px;color:#57606a;margin-top:4px">${esc(d)}</div>`)
      .join('');
    const hervor = b.rang === 1 ? 'background:#f6fff8;' : '';
    return (
      `<tr style="border-top:1px solid #d0d7de;${hervor}">` +
      td(`<b>${b.rang}</b>`, 'center') +
      td(`<b>${esc(b.lieferant)}</b>${details}`) +
      td(eur(b.summe_netto), 'right', 'white-space:nowrap') +
      td(`<b>${eur(b.effektiv)}</b>`, 'right', 'white-space:nowrap') +
      td(`${b.lieferzeit_wt ?? '?'} AT`, 'right', 'white-space:nowrap') +
      td(badge(b.kategorie)) +
      `</tr>`
    );
  })
  .join('');

const tabelle =
  `<div style="overflow-x:auto;border:1px solid #d0d7de;border-radius:10px">` +
  `<table style="width:100%;border-collapse:collapse;font-size:14px">` +
  `<tr style="background:#f6f8fa">${th('#', 'center')}${th('Lieferant')}${th('Netto', 'right')}${th('Effektiv', 'right')}${th('Lieferzeit', 'right')}${th('Status')}</tr>` +
  zeilen +
  `</table></div>`;

const html =
  `<div style="text-align:left;color:#1f2328">` +
  (k.empfehlung ? `<p style="font-size:16px;line-height:1.5;margin:0 0 14px">${esc(k.empfehlung)}</p>` : '') +
  kpis +
  begruendung +
  `<div style="font-weight:700;margin:0 0 8px">Rangliste</div>` +
  tabelle +
  `<p style="font-size:12px;color:#57606a;margin-top:10px">Effektiv = netto ohne erstattbares Pfand, abzüglich Skonto. Es wird nichts automatisch bestellt.</p>` +
  `</div>`;

const text = [k.empfehlung, k.begruendung, k.abgrenzung, k.naechster_schritt].filter(Boolean).join('\n\n');

return [{ json: { html, text, titel: `Entscheidungsvorlage ${r.anfrage}` } }];
