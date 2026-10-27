// Jede eingehende Mail (oder jeder Testlauf) kann mehrere Anhänge haben.
// Wir machen daraus ein Item pro PDF, immer im Binärfeld "data".
const out = [];
for (const item of $input.all()) {
  const bin = item.binary || {};
  for (const file of Object.values(bin)) {
    const name = (file.fileName || '').toLowerCase();
    const istPdf = (file.mimeType || '').includes('pdf') || name.endsWith('.pdf');
    if (!istPdf) continue;
    if (name.startsWith('00_anfrage')) continue; // eigene Anfrage nicht als Angebot werten
    out.push({
      json: {
        quelle_datei: file.fileName,
        absender: item.json.from || 'Testlauf',
        betreff: item.json.subject || '',
        empfangen_am: item.json.date || new Date().toISOString(),
      },
      binary: { data: file },
    });
  }
}
return out;
