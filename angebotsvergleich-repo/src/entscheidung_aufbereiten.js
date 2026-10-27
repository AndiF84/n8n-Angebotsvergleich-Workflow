// Entscheidung der Einkaufsleitung festhalten (Audit-Trail).
const r = $('Ranking & Bewertung').first().json;
const antwort = $input.first().json;
const entscheidung = antwort.entscheidung ?? antwort['Entscheidung'] ?? '';
const freigegeben = String(entscheidung).startsWith('Freigeben');
return [
  {
    json: {
      anfrage: r.anfrage,
      ergebnis: freigegeben ? 'freigegeben' : 'abgelehnt',
      lieferant: r.favorit.lieferant,
      angebotsnr: r.favorit.angebotsnr,
      summe_netto: r.favorit.summe_netto,
      effektiv: r.favorit.effektiv,
      anzahl_angebote: r.anzahl_angebote,
      kommentar: antwort.kommentar ?? antwort['Kommentar'] ?? '',
      begruendung_ki: $('Vorlage gestalten').first().json.text,
      naechster_schritt: freigegeben
        ? 'Bestellung manuell im Warenwirtschaftssystem auslösen'
        : 'Angebote erneut prüfen oder nachverhandeln',
    },
  },
];
