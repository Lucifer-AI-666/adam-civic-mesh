import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const entries = [
  // === STORIA ===
  {
    title: "Storia di Acqui Terme - Origini Romane",
    category: "storia",
    content: `Acqui Terme (Àich in piemontese) è un comune di circa 19.000 abitanti nella provincia di Alessandria, Piemonte. Fondata come Aquae Statiellae, la città ha origini antichissime. I Liguri Statielli abitavano la zona con il centro di Carystum. Tra il II e I secolo a.C. si formò il centro urbano romano. La Via Aemilia Scauri (109 a.C.) collegava Tortona a Vado Ligure passando per Acqui. Divenne municipio romano assegnato alla tribù Tromentina, nella Regione IX augustea. Plinio il Vecchio cita le terme di Acqui tra le più importanti del mondo romano, insieme a Pozzuoli e Aix-en-Provence.`,
    source: "Wikipedia / Fonti storiche"
  },
  {
    title: "Storia Medievale e Moderna di Acqui Terme",
    category: "storia",
    content: `Nel IV secolo Acqui divenne sede vescovile. San Maggiorino fu il primo vescovo. San Guido (patrono, festa 11 luglio) consacrò la cattedrale nel 1067. Nel 1278 Acqui passò al Marchesato del Monferrato sotto Guglielmo VII. Nel 1306 passò ai Paleologi (famiglia imperiale bizantina). Nel 1533 ai duchi di Mantova. Nel 1708 fu annessa al Piemonte sabaudo. Durante la WWII fu luogo di internamento per ebrei stranieri (1941-1943). Il sindaco attuale è Danilo Rapetti (dal 2022).`,
    source: "Wikipedia / Archivio storico"
  },
  {
    title: "Acqui Statiellae - La Città Romana",
    category: "storia",
    content: `Aquae Statiellae era il nome romano di Acqui Terme. La città era dotata di almeno tre impianti termali, un monumentale acquedotto di 12 km (dal Lago Scuro di Cartosio), un teatro e tutti i servizi di un importante municipio. Il territorio del municipium si estendeva tra la sponda sinistra del torrente Orba e il crinale appenninico, comprendendo le valli del Belbo e delle due Bormide. La città era un nodo stradale importante sulla Via Aemilia Scauri (poi Via Julia Augusta in età imperiale), che collegava la Pianura Padana con la Gallia Narbonense e la Spagna attraverso la Riviera di Ponente.`,
    source: "Fonti archeologiche / cultura.gov.it"
  },
  // === MONUMENTI ===
  {
    title: "La Bollente - Simbolo di Acqui Terme",
    category: "turismo",
    content: `La Bollente è la fonte termale più celebre di Acqui Terme, simbolo della città. Si trova in Piazza della Bollente ed è un'edicola marmorea ottagonale progettata dall'architetto Giovanni Ceruti nel 1879. L'acqua sgorga costantemente a circa 75°C, ricca di zolfo, calcio e magnesio. Già nota in epoca romana, la fonte era usata per trattamenti terapeutici. Tradizione locale: i neonati acquesi venivano immersi nell'acqua bollente per "temprarli" - i sopravvissuti erano chiamati "sgaientò" (scottato in dialetto) e riconosciuti come autentici cittadini acquesi.`,
    source: "turismo.comuneacqui.it / granmonferrato.it"
  },
  {
    title: "Castello dei Paleologi e Museo Archeologico",
    category: "turismo",
    content: `Il Castello dei Paleologi, risalente all'XI secolo, domina il centro di Acqui Terme da una collina. Prende il nome dalla famiglia bizantina dei Paleologi, marchesi del Monferrato dal XIV secolo. Ospita il Museo Archeologico con reperti dalla preistoria al Medioevo: mosaici, monete, sculture, utensili. Include un Giardino Botanico. L'architettura presenta mura in pietra, torri merlate e cortile interno dove si tengono eventi culturali. Le terrazze offrono un panorama sulle colline del Monferrato (Patrimonio UNESCO). La struttura attuale risale alla ricostruzione del 1663.`,
    source: "granmonferrato.it / Museo Archeologico"
  },
  {
    title: "Acquedotto Romano di Acqui Terme",
    category: "turismo",
    content: `L'acquedotto romano di Acqui Terme, del I secolo d.C. (epoca augustea), è tra i meglio conservati del Nord Italia. Lungo circa 12 km, trasportava acqua dal Lago Scuro (Cartosio) alla città. Dei circa 40 piloni originali ne rimangono 15, alti circa 15 metri, con 4 arcate superstiti. La maggior parte del tracciato era sotterranea con volte a botte. Visibile dal Ponte Carlo Alberto sul fiume Bormida. È un monumento nazionale tutelato dal Ministero della Cultura.`,
    source: "cultura.gov.it / granmonferrato.it"
  },
  {
    title: "Cattedrale Santa Maria Assunta (Duomo)",
    category: "turismo",
    content: `La Cattedrale di Santa Maria Assunta è il Duomo di Acqui Terme, di origine romanica, consacrata nel 1067 dal vescovo San Guido. Si trova in Piazza Duomo nel centro storico. Presenta una facciata in mattoni rossi e pietra. All'interno: cripta romanica con colonne e capitelli scolpiti, reliquie di San Guido, e il grande affresco dell'Incoronazione della Vergine (XV secolo) nella volta dell'abside. Il chiostro adiacente è visitabile con guide. Disponibile audioguida interattiva online.`,
    source: "michelanellevalli.com / Diocesi di Acqui"
  },
  {
    title: "Torre Civica dell'Orologio",
    category: "turismo",
    content: `La Torre Civica dell'Orologio di Acqui Terme fu costruita nel 1763 su progetto dell'architetto Giuseppe Domenico Trolli. È nota come "La Torre senza fondamenta" perché non ha fondamenta proprie: poggia sulla struttura delle case circostanti. La porta sottostante, che collega Piazza della Bollente a Corso Italia, risale alla fine del 1100 ed è molto più antica della torre. Dalla sommità si gode una splendida vista sulla città.`,
    source: "granmonferrato.it"
  },
  {
    title: "Chiesa di San Francesco e Fontana delle Ninfee",
    category: "turismo",
    content: `La Chiesa di San Francesco sorge vicino alla Bollente, collegata a un ex convento francescano con due chiostri quattrocenteschi. Ricostruita in stile neoclassico a metà XIX secolo (tranne abside e campanile gotici). Ha un portone ligneo dello scultore Giulio Monteverde e affreschi di Pietro Ivaldi "Il Muto". La Fontana delle Ninfee in Piazza Italia è opera dell'architetto Gaspare De Fiore (anni 2000): una cascata d'acqua con bassorilievi di ninfe che celebra la vocazione millenaria di Acqui come città d'acqua.`,
    source: "Wikipedia / granmonferrato.it"
  },
  {
    title: "Teatro Romano e Basilica di San Pietro",
    category: "turismo",
    content: `I resti del Teatro Romano si trovano in Via Scatilazzi. Ciò che si vede oggi è solo una piccola parte dell'originale anfiteatro imponente. La parte più importante, rinvenuta durante gli scavi, è stata ricoperta per difficoltà di esposizione. La Basilica di San Pietro è di origine paleocristiana, una delle chiese più antiche della città, fondata come monastero maschile dal vescovo San Guido nell'XI secolo.`,
    source: "granmonferrato.it / fonti archeologiche"
  },
  // === TERME E BENESSERE ===
  {
    title: "Terme di Acqui - Proprietà e Stato Attuale",
    category: "turismo",
    content: `Le acque termali di Acqui Terme sono sulfuree, sgorgano a 75°C e sono ricche di zolfo, calcio e magnesio. Proprietà terapeutiche: cura della pelle, dolori articolari, reumatismi, balneoterapia. La tradizione termale risale ai Romani. L'Hotel Antiche Terme con il suo parco monumentale è un punto di riferimento. ATTENZIONE: attualmente i bagni termali pubblici di Acqui Terme sono chiusi. La Bollente in piazza resta sempre accessibile e visitabile gratuitamente.`,
    source: "turismo.comuneacqui.it"
  },
  // === GASTRONOMIA E VINI ===
  {
    title: "Brachetto d'Acqui DOCG e Vini del Territorio",
    category: "gastronomia",
    content: `Il Brachetto d'Acqui DOCG è il vino più celebre del territorio: rosso dolce, leggermente frizzante o spumante, con aromi di rosa, lampone, fragola e cranberry. Colore porpora/rubino. Prodotto nelle province di Alessandria e Asti. Servire fresco. Perfetto con dessert e frutta. Altri vini: Dolcetto d'Acqui DOC (rosso secco), Barbera del Monferrato, Cortese dell'Alto Monferrato (bianco). La zona vinicola dell'Alto Monferrato è parte del patrimonio UNESCO delle colline vitivinicole del Piemonte.`,
    source: "Consorzio Brachetto d'Acqui / wineblogroll.com"
  },
  {
    title: "Gastronomia Acquese e Piemontese",
    category: "gastronomia",
    content: `La cucina di Acqui Terme è quella piemontese dell'Alto Monferrato: agnolotti del plin (pasta ripiena), tajarin (tagliolini all'uovo), bagna cauda (salsa calda di acciughe e aglio con verdure crude), bollito misto con salsa verde e bagnet ross, vitello tonnato, fritto misto alla piemontese. Prodotti tipici: nocciole Tonda Gentile, tartufo bianco d'Alba (stagione autunnale), formaggi (Robiola di Roccaverano DOP, toma piemontese), amaretti di Acqui (biscotti alle mandorle), miele. La Festa delle Feste (settembre) riunisce oltre 20 Proloco del territorio per un weekend enogastronomico.`,
    source: "turismo.comuneacqui.it / tradizione locale"
  },
  // === EVENTI ===
  {
    title: "Eventi e Feste di Acqui Terme",
    category: "eventi",
    content: `Principali eventi annuali: Acqui Terme Romana (giugno) - rievocazione storica con giochi, gastronomia romana, corteo imperiale e cerimonia della Bollente. Festa delle Feste (settembre) - oltre 20 Proloco, enogastronomia e divertimento in Piazza Levi. Festa di San Guido (11 luglio) - patrono della città. Palio dei Rioni - competizione tra quartieri. Sagra degli Gnocchi, Sagra della Tira, Sagra della Lumaca. Bacchanalia (Notte Bianca) - vie del centro animate con spettacoli. Mercatini di Natale in periodo natalizio.`,
    source: "turismo.comuneacqui.it / sagritaly.com"
  },
  // === DIALETTO ===
  {
    title: "Dialetto Acquese - Espressioni e Modi di Dire",
    category: "dialetto",
    content: `Il dialetto acquese è una variante del piemontese parlata ad Acqui Terme e nell'Acquese. Acqui si dice "Àich". Espressioni tipiche: "Sgaientò" = scottato (vero acquese, immerso nella Bollente da neonato). "Va bin" = va bene. "Anduma" = andiamo. "Fuma c'anduma" = dai che andiamo. "Neh" = vero?/non è vero? "Bòia fàuss" = esclamazione di stupore/incredulità. "Ciulé" = prendere. "Travajé" = lavorare. "Mangé" = mangiare. "Beive" = bere. "Cit" = piccolo. "Grand" = grande. "Bel" = bello. "Brut" = brutto. "Gnente" = niente. "Fé" = fare. "Bundì" = buongiorno. "Buna sèira" = buonasera. "Mersì" = grazie. "Scusme" = scusami. "Com a stà?" = come stai? "Ben, mersì" = bene, grazie.`,
    source: "Tradizione orale / Wikibooks piemontese"
  },
  {
    title: "Proverbi e Detti Acquesi",
    category: "dialetto",
    content: `Proverbi e detti in dialetto acquese/piemontese: "Ël vin e i segret a peulo nen vive ansema" = Il vino e i segreti non possono vivere insieme. "Chi a mangia sensa beive, a mura sensa ciòd" = Chi mangia senza bere, mura senza chiodi. "A l'é mej un euv ancheuj che na galina dman" = È meglio un uovo oggi che una gallina domani. "L'acqua a fa mal e ël vin a fa canté" = L'acqua fa male e il vino fa cantare. "Chi a dorm a ciapa nen ëd pess" = Chi dorme non piglia pesci. "A Àich l'acqua a buj e la gent a l'é brava" = Ad Acqui l'acqua bolle e la gente è brava.`,
    source: "Tradizione orale piemontese"
  },
  // === SERVIZI COMUNALI ===
  {
    title: "Servizi del Comune di Acqui Terme",
    category: "servizi",
    content: `Comune di Acqui Terme - CAP 15011, Prefisso telefonico 0144. Centralino: 0144 770111. Sito web: comune.acquiterme.al.it. Sito turismo: turismo.comuneacqui.it. Sindaco: Danilo Rapetti (dal 2022). Servizi principali: Anagrafe e Stato Civile, Tributi (IMU, TARI, TASI), Urbanistica ed Edilizia, Servizi Sociali, Cultura e Biblioteca, Turismo e Manifestazioni, Polizia Municipale, Ambiente, Sport. Acqui è centro-zona della provincia con ospedale e polo scolastico superiore. Regolamenti consultabili online sul sito comunale.`,
    source: "comune.acquiterme.al.it"
  },
  {
    title: "Informazioni Pratiche per Cittadini",
    category: "servizi",
    content: `Informazioni pratiche Acqui Terme: Altitudine 156 m s.l.m. Superficie 33,3 km². Zona sismica 3 (bassa). Zona climatica E (2.613 gradi giorno). Frazioni: Lussito, Moirano, Ovrano. Comuni confinanti: Alice Bel Colle, Castel Rocchero (AT), Cavatore, Grognardo, Melazzo, Montabone (AT), Ricaldone, Strevi, Terzo, Visone. Fuso orario: UTC+1. Codice ISTAT: 006001. Codice catastale: A052. Targa: AL. Abitanti chiamati: acquesi. Patrono: San Guido (11 luglio). Il mercato settimanale si tiene il martedì e il venerdì.`,
    source: "comune.acquiterme.al.it / ISTAT"
  },
  // === TERRITORIO ===
  {
    title: "Il Territorio dell'Acquese e l'Alto Monferrato",
    category: "territorio",
    content: `Acqui Terme si trova nell'Alto Monferrato, nella media-bassa valle del fiume Bormida, tra colline dolcemente ondulate. Posizione strategica all'incrocio di strade importanti: la statale del Turchino (Asti-Nizza Monferrato-Acqui-Ovada-Voltri), la Val Bormida (Alessandria-Savona via Colle di Cadibona), la strada del Sassello (Acqui-Varazze via Colle del Giovo). Il nucleo antico comprende Borgo Pisterna, Borgo Nuovo e Borgo San Pietro. Oltre il Bormida: zona termale dei Bagni. Le colline del Monferrato sono Patrimonio UNESCO. Il territorio è vocato alla viticoltura (Brachetto, Dolcetto, Barbera) e alla produzione di nocciole.`,
    source: "Wikipedia / turismo.comuneacqui.it"
  },
  {
    title: "Acqui Terme - Come Arrivare e Muoversi",
    category: "servizi",
    content: `Come arrivare ad Acqui Terme: In auto da Genova/Torino tramite A26 (uscita Ovada) o A21 (uscita Alessandria Sud). Da Milano: A7 fino a Tortona poi SP. In treno: stazione ferroviaria sulla linea Genova-Asti-Torino e Alessandria-San Giuseppe di Cairo. Treni regionali frequenti. In autobus: linee extraurbane collegano Acqui con Alessandria, Asti, Genova e i comuni limitrofi. Il centro storico è percorribile a piedi. Parcheggi disponibili in Piazza Italia e zone limitrofe.`,
    source: "Trenitalia / comune.acquiterme.al.it"
  }
];

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log("Connesso al database. Inserimento knowledge base...");
  
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
  console.log(`\nInserite ${entries.length} voci nella knowledge base.`);
}

seed().catch(console.error);
