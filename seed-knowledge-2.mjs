import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const entries = [
  // === RISTORANTI E GASTRONOMIA ===
  {
    title: "Ristoranti di Acqui Terme - Dove Mangiare",
    category: "commercio",
    content: `Acqui Terme offre un'ampia scelta di ristoranti con cucina piemontese e monferrina. Tra i più noti: La Casa Di Ro (cucina creativa), Caffè dei Mercanti (centro storico), Angolo Divino (enoteca con cucina), Osteria X Bacco (tradizionale), Pizzeria La Via del Sale, Da Nonna Gina (conduzione familiare, centro città, piatti tradizionali innovativi), Osteria 46 (tradizione piemontese e monferrina), Parisio 1933 (via Cesare Battisti 7, centro storico, locale storico rinnovato). Ristoranti segnalati dalla Guida Michelin: Da Fausto, Cacciatori, Da Iumén, Mirepuà Food Lab, Del Belbo - Da Bardon, Le Due Lanterne, Violetta, L'Archivolto - Osteria Nostrale. Agriturismi: Azienda agricola I Moie, Cascina La Maggiora, Borgo Monterosso - Villa Ottolenghi. Per prenotazioni consultare TheFork o contattare direttamente i locali.`,
    source: "TheFork / Guida Michelin / turismo.comuneacqui.it"
  },
  {
    title: "Hotel e Dove Dormire ad Acqui Terme",
    category: "commercio",
    content: `Acqui Terme dispone di circa 56 strutture ricettive tra hotel, B&B e agriturismi. Hotel principali: Hotel Valentino (relax enogastronomico), Hotel Ariston (vicino piscina termale Nuove Terme), Hotel Acqui & Centro Benessere (con spa al terzo piano, riservata ai clienti), Hotel Monteverde, Hotel La Meridiana, Verdmont (country house). Per chi cerca B&B e agriturismi: numerose opzioni nelle colline circostanti con vista sul Monferrato. Prezzi medi: da 68€/notte per strutture base a 150€+ per hotel con spa. Prenotazioni su Booking.com, Tripadvisor o contatto diretto. Il sito turismo.comuneacqui.it ha l'elenco completo delle strutture ricettive.`,
    source: "Booking.com / granmonferrato.it / turismo.comuneacqui.it"
  },
  {
    title: "Attività Commerciali del Centro Storico",
    category: "commercio",
    content: `Il centro storico di Acqui Terme è animato da numerose attività commerciali concentrate tra Corso Italia, Corso Dante, Piazza della Bollente e le vie limitrofe. Si trovano: negozi di abbigliamento, botteghe artigianali, enoteche (con degustazione Brachetto e vini locali), pasticcerie (amaretti di Acqui), gastronomie con prodotti tipici piemontesi, librerie, farmacie. Il mercato settimanale si tiene il martedì e il venerdì in Piazza Levi e vie adiacenti con bancarelle di alimentari, abbigliamento, casalinghi. Il gruppo Facebook "Shopping Acqui Terme" promuove le attività commerciali locali. Per informazioni sulle attività: Confcommercio Acqui Terme o Comune.`,
    source: "Fonti locali / Facebook Shopping Acqui Terme"
  },
  // === SERVIZI COMUNALI DETTAGLIATI ===
  {
    title: "Ufficio Anagrafe - Comune di Acqui Terme",
    category: "servizi",
    content: `Ufficio Anagrafe del Comune di Acqui Terme. Sede: Palazzo Levi, Piazza Levi 12, Piano Terra. Telefono: 0144 770512. Email: anagrafe@comune.acquiterme.al.it. PEC: acqui.terme@cert.ruparpiemonte.it. Servizi offerti: certificati anagrafici (residenza, stato di famiglia, nascita, matrimonio, cittadinanza), carta d'identità elettronica (CIE), cambio residenza, AIRE (anagrafe italiani residenti estero), dichiarazioni sostitutive. I certificati anagrafici sono scaricabili anche ONLINE tramite il portale ANPR (Anagrafe Nazionale Popolazione Residente) con SPID o CIE. Sportello SPID disponibile su appuntamento: tel. 0144.770209 o email rao.spid@comune.acquiterme.al.it.`,
    source: "comune.acquiterme.al.it"
  },
  {
    title: "Ufficio Tributi - Comune di Acqui Terme",
    category: "servizi",
    content: `Ufficio Tributi del Comune di Acqui Terme. Telefono: 0144 770532 (Tributi), 0144 770533 (Recupero Crediti). Per consulenze specifiche è necessario fissare un appuntamento telefonando ai numeri sopra indicati. Servizi: IMU (Imposta Municipale Unica), TARI (Tassa Rifiuti), TASI, canone unico patrimoniale, imposta di soggiorno. Pagamenti effettuabili tramite PagoPA. Per informazioni generali: centralino 0144 7701. Sede: Palazzo Levi, Piazza Levi 12.`,
    source: "comune.acquiterme.al.it"
  },
  {
    title: "Sportello Unico Edilizia (SUE) - Comune di Acqui Terme",
    category: "servizi",
    content: `Sportello Unico per l'Edilizia (SUE) del Comune di Acqui Terme. Sede: Piazza Levi 12. Telefono: 0144 7701. Email: urbanistica@comune.acquiterme.al.it. Per accedere al servizio online è necessario autenticarsi con SPID/CIE tramite il portale GEOTECSue. Servizi: permessi di costruire, SCIA edilizia, CILA, agibilità, condoni, vincoli paesaggistici. Per pratiche urbanistiche complesse si consiglia appuntamento telefonico.`,
    source: "comune.acquiterme.al.it / geotecsue"
  },
  {
    title: "URP e Protocollo - Comune di Acqui Terme",
    category: "servizi",
    content: `Ufficio Relazioni col Pubblico (URP), Messi e Protocollo del Comune di Acqui Terme. Sede: Piazza Levi 12, 15011 Acqui Terme (AL). Telefono centralino: +39 0144 7701. P.IVA Comune: 00430560060. PEC: acqui.terme@cert.ruparpiemonte.it. L'URP è il primo punto di contatto per i cittadini: fornisce informazioni su tutti i servizi comunali, riceve istanze e segnalazioni, gestisce il protocollo in entrata. Per accedere ai servizi digitali del Comune è possibile usare SPID, CIE o CNS. Il Comune è presente anche sull'app IO per notifiche e certificati.`,
    source: "comune.acquiterme.al.it"
  },
  {
    title: "Servizi Sociali e Cultura - Comune di Acqui Terme",
    category: "servizi",
    content: `Servizi Sociali del Comune di Acqui Terme: assistenza domiciliare, contributi economici, sostegno famiglie, servizi per anziani e disabili, asilo nido, mensa scolastica, trasporto scolastico. Sede: Palazzo Levi, Piazza Levi 12. Per appuntamenti: 0144 7701. Servizi Cultura: Biblioteca Civica (prestito libri, sala studio, eventi culturali), Teatro Ariston (stagione teatrale), Museo Archeologico (Castello dei Paleologi), eventi culturali e mostre. Turismo: Ufficio Turistico IAT per informazioni, guide, materiale informativo. Sito turismo: turismo.comuneacqui.it.`,
    source: "comune.acquiterme.al.it"
  },
  {
    title: "Polizia Municipale e Numeri Utili Acqui Terme",
    category: "servizi",
    content: `Numeri utili Acqui Terme: Comune (centralino): 0144 7701. Polizia Municipale: 0144 770260. Carabinieri: 112. Polizia di Stato: 113. Vigili del Fuoco: 115. Emergenza Sanitaria (118). Guardia Medica. Ospedale Civile di Acqui Terme: Azienda Sanitaria Locale AL. Agenzia delle Entrate (Ufficio Territoriale Acqui Terme): Via Giosuè Carducci 28, tel. 01312001. Farmacia di turno: consultare sito ASL AL o app. Taxi: disponibili in stazione. Soccorso stradale ACI: 803116.`,
    source: "comune.acquiterme.al.it / fonti istituzionali"
  },
  {
    title: "Imposta di Soggiorno e Turismo",
    category: "servizi",
    content: `Il Comune di Acqui Terme applica l'imposta di soggiorno per i turisti che pernottano nelle strutture ricettive del territorio. L'imposta è destinata a finanziare interventi in materia di turismo, manutenzione, fruizione e recupero dei beni culturali e ambientali. Per informazioni dettagliate sulle tariffe e le esenzioni, contattare l'Ufficio Tributi (0144 770532) o consultare il sito turismo.comuneacqui.it. Le strutture ricettive sono tenute a riscuotere l'imposta e a versarla al Comune.`,
    source: "turismo.comuneacqui.it / comune.acquiterme.al.it"
  }
];

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Connesso al database. Inserimento knowledge base (parte 2)...");
  
  for (const entry of entries) {
    try {
      await conn.execute(
        `INSERT INTO knowledge_base (title, category, content, sourceUrl, verified, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [entry.title, entry.category, entry.content, entry.source]
      );
      console.log(`  + ${entry.title}`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`  ~ ${entry.title} (già presente)`);
      } else {
        console.error(`  ! Errore: ${entry.title}`, err.message);
      }
    }
  }
  
  await conn.end();
  console.log(`\nInserite ${entries.length} voci aggiuntive nella knowledge base.`);
}

seed().catch(console.error);
