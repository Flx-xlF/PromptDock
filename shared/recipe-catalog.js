/**
 * PromptDock — Recipe Catalog & Chunking Engine
 * Dual-compatible: ESM (import) & Non-ESM (globalThis.PromptDockCatalog)
 */

(function (root, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        const exports = factory();
        root.PromptDockCatalog = exports;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

    // Global constraints block prepended to Turn 1
    const G_RAHMEN = `RAHMENBEDINGUNGEN:
- Keine leeren Phrasen, Füllwörter oder KI-typischen Formulierungen. Jeder Satz muss Informationsgehalt haben.
- Unterscheide strikt zwischen Fakten, Annahmen und Bewertungen.
- Belegstatus-Kennzeichnung für alle Fakten:
  ✅ Belegt (aus vorliegenden Unterlagen oder verifizierbarer Quelle)
  ⚠️ Plausibel, aber nicht verifiziert
  ❌ Nicht überprüfbar
- Fehlende Daten oder Informationslücken explizit benennen, nicht überspielen.`;

    // Atomic Chunk Definitions
    const CHUNKS = {
        // --- INTAKE ADAPTERS ---
        'I-MEDIA': {
            id: 'I-MEDIA',
            title: 'Inhalts-Analyse (Medien/Fragen)',
            text: `TASK 1: INHALTS-ANALYSE & FRAGENKATALOG
Analysiere den Inhalt der Medienanfrage bzw. des Fragenkatalogs im Mailtext sowie allfälliger verlinkter oder angehängter Dateien.
Isoliere:
- die eigentliche Kernfrage und das übergeordnete Thema,
- alle expliziten und impliziten Teilfragen (vollständig nummeriert erfassen),
- die enthaltenen Thesen, Unterstellungen oder Vorannahmen,
- den erkennbaren journalistischen Fokus, die vermutete Storyline und Stossrichtung,
- allfällige Fristen oder Deadlines.

FRAGENKATALOG-TYPOLOGIE:
Beurteile die Struktur und Absicht der gestellten Fragen:
- Liegen voneinander unabhängige, rein sachlich-faktische Einzelfragen vor?
- Oder handelt es sich um kaskadierende, suggestive oder manipulative Fragen, die eine bestimmte Problem- oder Schuldthese stützen sollen?
- Welche Fragen bauen aufeinander auf oder zerlegen einen zusammenhängenden Sachverhalt künstlich in Einzelschritte?`
        },
        'I-MAIL': {
            id: 'I-MAIL',
            title: 'Inhalts-Analyse (E-Mail/Vorgang)',
            text: `TASK 1: INHALTS-ANALYSE
Analysiere den Inhalt der E-Mail sowie allfälliger verlinkter oder angehängter Dateien.
Erfasse:
- die relevanten Fakten,
- den Kontext,
- die expliziten und impliziten Fragestellungen,
- beteiligte Personen und Organisationseinheiten.

TASK 2: ANLIEGEN IDENTIFIZIEREN
Identifiziere präzise, welches Anliegen an mich herangetragen wird.
Formuliere:
- die Kernfrage,
- allfällige Teilfragen,
- die eigentliche Entscheidung oder Unterstützung, die von mir erwartet wird.`
        },
        'I-DOC': {
            id: 'I-DOC',
            title: 'Inhalts-Analyse (Dokumentenprüfung)',
            text: `TASK 1: INHALTS-ANALYSE
Analysiere die verlinkte oder angehängte Datei bzw. den Entwurf.
Erfasse:
- Inhalt, Zweck und Zielsetzung des Dokuments,
- zentrale Aussagen und Kernbotschaften,
- relevante Faktenbehauptungen,
- sensible oder potenziell kontroverse Aussagen,
- den kommunikativen und reputativen Kontext.`
        },
        'I-PPT': {
            id: 'I-PPT',
            title: 'Inhalts- & Zielgruppen-Analyse (Verlinkte Präsentation)',
            text: `TASK 1: ZUGRIFF & BESTANDSAUFNAHME (VERLINKTE PRÄSENTATION IN OUTLOOK)
Greife direkt auf die in der vorliegenden E-Mail / Nachricht verlinkte PowerPoint-Präsentation (SharePoint-, OneDrive- oder Web-Link) bzw. allfällige Dateianhänge zu und analysiere den tatsächlichen Folieninhalt.

Erfasse systematisch:
1. ANLIEGEN & KONTEXT AUS DEM MAILTEXT:
   - Welches Anliegen, welche Zielgruppe und welche Rahmenbedingungen (Termin, Dringlichkeit) nennt die Kollegin / der Kollege in der begleitenden Nachricht?
   - Welches konkrete Ergebnis soll die Präsentation erzielen (z.B. formeller Geschäftsleitungs-/Vorstandsbeschluss, Budgetfreigabe, Projektstatus, Kundenüberzeugung)?
   - Was ist die entscheidende Frage aus Sicht der Adressaten («What's in it for us / for the company?»)?

2. ANALYSE DES VERLINKTEN DECKS (FOLIE FÜR FOLIE):
   - Folienanzahl, erkennbare Abschnitte und thematischer Aufbau des vorliegenden Decks.
   - Textdichte & Lesbarkeit: Überladene Folien («Textwüsten»), passive Bulletpoints vs. klare optische Botschaften.
   - Qualität der aktuellen Folientitel: Rein thematische Stichworte (z.B. «Status», «Hintergrund») vs. aussagekräftige Botschaften.

TASK 2: DRAMATURGIE-CHECK (PYRAMIDEN-PRINZIP & SCQA)
Gleiche das verlinkte Foliendeck mit dem Pyramiden-Prinzip ab:
- SITUATION: Ist die Ausgangslage für die Zielgruppe unstrittig und auf das Wesentliche verdichtet?
- KOMPLIKATION: Wird sofort spürbar, warum JETZT Handlungsbedarf besteht (Problem, Risiko, veränderte Marktlage, strategische Chance)?
- KERNFRAGE: Welche Leitfrage muss dieses Deck unmissverständlich beantworten?
- ANTWORT (GOVERNING THOUGHT): Liefert die Präsentation eine klare, tragfähige Beschluss- oder Handlungsempfehlung, oder verliert sie sich in Detailbeschreibungen?`
        },
        'I-MEET': {
            id: 'I-MEET',
            title: 'Inhalts-Analyse (Meeting)',
            text: `TASK 1: INHALTS-ANALYSE
Analysiere den Termin inkl. verlinkter oder angehängter Dateien.
Erfasse:
- Zweck und Ziel des Meetings,
- Teilnehmende und deren Rollen,
- Agenda und erwartete Themen.

TASK 2: ANLIEGEN IDENTIFIZIEREN
Identifiziere das Anliegen, das mich betrifft:
- was von mir erwartet wird (Entscheidung, Input, Information, Freigabe),
- welche Themen mich direkt betreffen,
- welche heiklen Punkte mich überraschen könnten.`
        },
        'I-QUERY': {
            id: 'I-QUERY',
            title: 'Inhalts-Analyse (Suchintention)',
            text: `SUCHBEGRIFF / SUCHSATZ:
{SUCHBEGRIFF}

TASK 1: INHALTS-ANALYSE & SUCHINTENTION
Analysiere den Suchbegriff/-satz sowie allfällige Dateien. Bestimme:
- die Kernfrage und Teilfragen,
- den Informationsbedarf und Nutzungskontext,
- die mutmassliche Handlung oder Entscheidung, die unterstützt werden soll.`
        },
        'I-TIME': {
            id: 'I-TIME',
            title: 'Zeitfenster-Vorbereitung',
            text: `ZEITRAUM: {ZEITRAUM}

TASK 1: ZEITFENSTER-VORBEREITUNG
Lege die zu analysierenden Zeitabschnitte anhand des angegebenen Zeitraums fest:
- Hauptarbeitszeitraum (Rückblick & Learnings)
- Abwesenheitstage / freie Tage
- Kürzlicher Status (Wochenende bis heute früh)`
        },

        // --- RESEARCH CHUNKS ---
        'R-FULL': {
            id: 'R-FULL',
            title: 'Recherche (Web & Microsoft Graph)',
            compile: (params) => {
                const focus = params?.focus || 'bisherige mediale Berichterstattung, öffentlich verfügbare Fakten, frühere Stellungnahmen und historische Kontexte';
                return `TASK: RECHERCHE

Recherchiere die relevanten Fakten zum isolierten Thema.

1. FAKTENRECHERCHE
Recherchiere: ${focus}.
Kennzeichne jede Faktenbehauptung mit ihrem Belegstatus (✅, ⚠️, ❌).

2. INTERNE RECHERCHE (MICROSOFT GRAPH)
Durchsuche frühere E-Mails, Teams-Chats, SharePoint-Inhalte und Wissensquellen nach:
- relevanten Fakten, bisherigen Positionierungen, Freigaben, Q&As, Argumentarien und vergleichbaren Fällen.
Die aktuell vorliegende Anfrage/Datei ist von dieser historischen Recherche zwingend auszuschliessen.`;
            }
        },
        'R-TIME': {
            id: 'R-TIME',
            title: 'Recherche (Zeitfenster Microsoft Graph)',
            text: `TASK: RECHERCHE VIA MICROSOFT GRAPH
Durchsuche alle gesendeten und empfangenen E-Mails, Teams-Chats, SharePoint-Seiten und Aktivitäten innerhalb des definierten Zeitfensters.
Basiere alle Auswertungen ausschliesslich auf echten Daten; erfinde keine Einträge und kennzeichne Lücken explizit.`
        },

        // --- CHECK LENSES ---
        'C-THESIS': {
            id: 'C-THESIS',
            title: 'Kritischer Thesen-Check',
            text: `TASK: THESEN-CHECK (STEEL-MANNING)
Hinterfrage die Thesen und Annahmen systematisch:
1. Formuliere die stärkste Version jeder These (Steel Man).
2. Formuliere die stärkste Gegenthese.
3. Identifiziere die Annahmen, die wahr sein müssten, damit die These hält.
4. Prüfe jede Annahme auf Belastbarkeit.
5. Erst dann: bewerte.
Unterscheide klar zwischen Tatsachen, Einschätzungen, Interpretationen und unbelegten Behauptungen.`
        },
        'C-REQUEST': {
            id: 'C-REQUEST',
            title: 'Kritischer Sachverhalts-Check',
            text: `TASK: KRITISCHER SACHVERHALTS-CHECK
Hinterfrage den Sachverhalt sowie das an mich herangetragene Anliegen systematisch:
1. Formuliere die stärkste Version des Anliegens (Steel Man).
2. Formuliere die stärkste Gegenposition.
3. Identifiziere die zugrundeliegenden Annahmen und prüfe sie auf Belastbarkeit.
4. Prüfe auf blinde Flecken, Fehleinschätzungen und alternative Interpretationen.`
        },
        'C-PERSPECTIVE': {
            id: 'C-PERSPECTIVE',
            title: 'Mehrperspektivische Einordnung',
            text: `TASK: KRITISCHE EINORDNUNG
Ordne die Themen systematisch aus mehreren Blickwinkeln ein:
- Wie würde ein kritischer Journalist das Thema aufgreifen?
- Wie würden politische Stakeholder und Aufsichtsbehörden reagieren?
- Welche internen Dynamiken und Risiken für die Reputation bestehen?`
        },
        'C-DRAFT': {
            id: 'C-DRAFT',
            title: 'Antwortvorschläge-Check',
            text: `TASK: ANTWORTVORSCHLÄGE-CHECK
Hinterfrage allfällige bereits vorhandene Antwortentwürfe auf:
- faktische Belastbarkeit, argumentative Schwachstellen, mediale Angriffsflächen, unbelegte Aussagen.
Falls keine Entwürfe vorliegen, diesen Schritt kurz mit «Kein Entwurf vorhanden» überspringen.`
        },

        // --- TLDR & HANDOFF ---
        'T-TLDR': {
            id: 'T-TLDR',
            title: 'TL;DR & Lagebild-Synthese',
            compile: (params) => {
                const mustInclude = params?.mustInclude || 'Kernfrage, zentrale Erkenntnis, wichtigster Vorbehalt/Risiko';
                return `TASK: TL;DR (LAGEBILD-SYNTHESE)
Fasse die wesentlichen Erkenntnisse aus Analyse, Recherche und Checks zusammen.
Qualitätsmassstab:
- Maximal 5 Zeilen.
- Pflichtinhalte: ${mustInclude}.
- Ein Entscheidungsträger muss auf Basis dieses Abschnitts allein handlungsfähig sein.`;
            }
        },

        // --- STRATEGY & AUDIT CHUNKS (TURN 2) ---
        'S-FULL': {
            id: 'S-FULL',
            title: 'Strategie-Abwägung & Haltung',
            compile: (params) => {
                const framings = params?.framings || 'proaktiv, defensiv, rein sachlich, einordnend, kontextualisierend, reputationsorientiert';
                const includeFormatAnalysis = params?.includeFormatAnalysis !== false;
                const formatBlock = includeFormatAnalysis ? `

TASK: FRAGENKATALOG- & FORMAT-ABWÄGUNG (BEANTWORTUNGS-ARCHITEKTUR)
Falls mehrere Fragen oder ein Fragenkatalog vorliegen: Wäge systematisch ab, welche Beantwortungsform die grösste Themenhoheit, mediale Belastbarkeit und Glaubwürdigkeit sichert:
1. Option A: Punkt-für-Punkt-Beantwortung (1:1 Frage für Frage)
   - Eignung: Bei rein sachlichen, voneinander unabhängigen Informationsfragen (Zahlen, Termine, Prozessabläufe).
   - Risiko: Übernahme des gegnerischen/journalistischen Framings; Gefahr, sich in suggestiven Teilfragen zu verfangen oder Fangfragen zu legitimieren.
2. Option B: Summarische Antwort (Zusammenhängendes Statement)
   - Eignung: Wenn Einzelfragen auf falschen Vorannahmen beruhen, rhetorisch/suggestiv sind oder das Thema als Gesamtnarrativ kontextualisiert werden muss (Themenhoheit).
   - Risiko: Vorwurf des Ausweichens («Medienstelle beantwortet konkrete Fragen nicht»).
3. Option C: Hybrider Ansatz / Thematische Clusterung
   - Eignung: Wenn die Fragen teils strategische Einordnung und teils konkrete, berechtigte Fakten/Zahlen erfordern.
   - Mechanik: Zusammenfassendes Haltungs-Statement zur Einordnung + gezielte Beantwortung sachlicher Kernpunkte oder Gruppierung in 2–3 Themenblöcke.

ENTSCHEIDUNG & BEGRÜNDUNG:
- Lege fest: Welches Format (Punkt-für-Punkt, Summarisch oder Hybrid/Geclustert) wird für diese Anfrage gewählt?
- Begründe kurz die strategische Wahl und wie das Risiko (z.B. Ausweichvorwurf vs. Framing-Falle) neutralisiert wird.` : '';

                return `TASK: STRATEGIE-ABWÄGUNG
Wäge verschiedene Antwortstrategien und Framings gegeneinander ab:
- Mögliche Framings: ${framings}.
- Beurteile Chancen und Risiken jeder Option aus medialer, politischer und reputationsbezogener Sicht.
- Frage dich bei jeder Strategie: Was würde ein kritischer Journalist oder politischer Gegner dagegen vorbringen?${formatBlock}

TASK: EMPFOHLENE HALTUNG
Lege dich auf die belastbarste Strategie fest und formuliere die empfohlene Grundhaltung in genau einem prägnanten Satz.

TASK: STORYLINE & ARGUMENTE
Entwickle auf Basis der gewählten Strategie die überzeugendste Storyline.
Leite daraus priorisierte Haupt- und Unterstützungsargumente ab.`;
            }
        },
        'S-LITE': {
            id: 'S-LITE',
            title: 'Haltung & Handlungsrichtung',
            text: `TASK: EMPFOHLENE HALTUNG
Wäge die Handlungsoptionen kurz ab, lege dich fest und formuliere die empfohlene Haltung bzw. den Kernentscheid in genau einem Satz.`
        },
        'S-MESSAGES': {
            id: 'S-MESSAGES',
            title: 'Kernbotschaften',
            compile: (params) => {
                const count = params?.count || 'drei';
                return `TASK: KERNBOTSCHAFTEN
Formuliere ${count} prägnante, zitierfähige Kernbotschaften, die die definierte Haltung transportieren.`;
            }
        },
        'S-DECISION': {
            id: 'S-DECISION',
            title: 'Handlungsoptionen & Entscheid',
            text: `TASK: HANDLUNGSOPTIONEN & BEURTEILUNG
Zeige mögliche Optionen auf (z.B. Freigabe ohne Auflagen, Freigabe mit Anpassungen, Überarbeitung, Nichtfreigabe bzw. Handlungsbedarf Ja/Nein) und bewerte Vor- und Nachteile.`
        },
        'S-ALIGN': {
            id: 'S-ALIGN',
            title: 'Strategieabgleich',
            text: `TASK: STRATEGIEABGLEICH
Analysiere die strategische Relevanz des Vorhabens:
- Konkreter Beitrag zur Gesamtstrategie (unter Einbezug der zuständigen Organisationseinheiten / Fachbereiche),
- Relevanz für die übergeordnete Positionierung,
- Chancen und Zielkonflikte für Reputation und Stakeholder.`
        },
        'S-PPT-STRATEGY': {
            id: 'S-PPT-STRATEGY',
            title: 'Präsentations-Strategie & Wegwahl',
            text: `TASK: STRATEGISCHE WEGWAHL FÜR DAS VERLINKTE DECK
Beurteile auf Basis des ausgelesenen Folienentwurfs und der begleitenden E-Mail zwei Handlungsoptionen:

1. WEG A: MINIMAL-INVASIVE SCHNELLHILFE (QUICK FIX FÜR DAS BESTEHENDE DECK)
   - Eignung: Wenn der Termin drängt, die bestehende Struktur der Kollegin / des Kollegen grundsätzlich tragfähig ist oder primär sprachliches und visuelles Polishing gesucht wird.
   - Hebel:
     * Bestehende Folienreihenfolge weitgehend beibehalten, aber jeden Folientitel in einen prägnanten «Action Title» (ganzer Satz mit Kernbotschaft) umwandeln.
     * Textwüsten und Aufzählungs-Friedhöfe rigide ausmisten: maximal 3 bis 4 Kernaussagen pro Folie.
     * Text in klare visuelle Raster übersetzen (z.B. 3-Spalten-Struktur, Vorher/Nachher, Callout-Boxen für Kernbeschlüsse).

2. WEG B: UMFASSENDES REDESIGN (STRATEGISCHE STORYLINE)
   - Eignung: Bei hoher strategischer Relevanz (Vorstands-/Entscheidungstermin), verfahrenem rotem Faden oder wenn die Kernbotschaft im aktuellen Deck untergeht.
   - Hebel:
     * Radikale Reorganisation nach dem Pyramiden-Prinzip (Bottom Line Up Front / BLUF).
     * Reduktion auf 5 bis 8 wirkungsvolle Kernfolien für den Hauptteil.
     * Auslagerung von technischen Details, Rohdaten und Nachweisen in einen dedizierten «Backup-/Anhang»-Bereich.

TASK: EMPFEHLUNG DES KOMMUNIKATIONSEXPERTEN
- Lege dich begründet fest: Welcher Weg (A oder B) liefert der Kollegin / dem Kollegen den höchsten Hebel bei vertretbarem Aufwand?
- Formuliere die tragende Leitbotschaft der Präsentation in genau einem prägnanten Satz.`
        },
        'A-AUDIT-ALL': {
            id: 'A-AUDIT-ALL',
            title: '3D-Audit (Fakten, Logik, Reputation)',
            text: `TASK: SYSTEMATISCHES DREI-DIMENSIONEN-AUDIT

1. FAKTENCHECK:
Prüfe sachliche Richtigkeit, Vollständigkeit, Aktualität und korrekte Einordnung von Zahlen und Zusammenhängen.

2. LOGIKCHECK:
Prüfe innere Konsistenz, Nachvollziehbarkeit, unbegründete Schlussfolgerungen, Widersprüche und gedankliche Sprünge.

3. REPUTATIONSCHECK:
Nimm die Perspektive eines investigativen Journalisten, eines politischen Gegners und eines skeptischen Stakeholders ein.
Prüfe auf negative Framings, Angriffsflächen, politisch sensible Aussagen und Risiken für die Glaubwürdigkeit.

Schlage für jede Beanstandung minimalinvasive Korrekturen vor (nur bei gravierenden Mängeln komplette Neuformulierungen).`
        },
        'D-DELTA': {
            id: 'D-DELTA',
            title: 'Delta-Analyse',
            text: `TASK: DELTA-ANALYSE
Vergleiche den Stand zu Beginn des Zeitfensters mit dem aktuellen Status:
- Wo gab es Planänderungen oder Eskalationen?
- Welche Fristen rücken näher? Welche Themen haben sich verändert?`
        },

        // --- OUTPUT TEMPLATES (TURN 3 / TURN 2 FINAL) ---
        'O-MEDIA': {
            id: 'O-MEDIA',
            title: 'Medienantwort',
            text: `TASK: MEDIENANTWORT
Formuliere auf Basis der festgelegten Strategie, Storyline und gewählten Beantwortungs-Architektur den finalen Entwurf der Medienantwort.

FORMAT-VORGABE:
- Setze die in der Strategie-Phase gewählte Beantwortungsform konsequent um:
  * Bei summarischer Antwort: Ein zusammenhängendes, druckreifes Statement mit klaren Kernbotschaften, das den Gesamtsachverhalt souverän einordnet.
  * Bei hybridem/geclustertem Ansatz: Ein einleitendes Kernstatement gefolgt von thematisch gebündelten Sachantworten zu den berechtigten Informationsfragen.
  * Bei Punkt-für-Punkt: Präzise, nummerierte Antworten auf jede Einzelfrage ohne Rechtfertigungston.

QUALITÄTSKRITERIEN & EVASION-CHECK:
- Faktisch belastbar, verständlich, medientauglich, frei von PR-Floskeln.
- Konsistent mit der definierten Haltung.
- Abdeckungs-Check: Wurden alle berechtigten Informationsbedürfnisse der Medienanfrage substanziell adressiert, sodass kein Vorwurf des Ausweichens («Fragen blieben unbeantwortet») erhoben werden kann?`
        },
        'O-REPLY': {
            id: 'O-REPLY',
            title: 'Antwortentwurf (E-Mail)',
            text: `TASK: ANTWORTENTWURF
Formuliere auf Basis der Erkenntnisse und der gewählten Haltung einen passenden, versandfertigen Antwortentwurf.
Die Antwort soll:
- klar, verständlich und adressatengerecht,
- faktenbasiert und handlungsauslösend
sein.`
        },
        'O-QA': {
            id: 'O-QA',
            title: 'Q+A Tabelle',
            text: `TASK: Q+A TABELLE
Erstelle ein kritisches Q+A mit den 8 bis 10 wahrscheinlichsten und heikelsten Fragen eines investigativen Journalisten.
FORM:
| FRAGEN | ANTWORTEN | BEGRÜNDUNG |
|--------|-----------|------------|`
        },
        'O-INTERVIEW': {
            id: 'O-INTERVIEW',
            title: 'Interview- & Medienbriefing',
            text: `TASK: INTERVIEW- UND MEDIENBRIEFING
Stelle den Output in exakt folgender Struktur dar:
1. Ziel und Charakter des Gesprächs
2. Rolle und Positionierung der Vertretung
3. Die passende Grundhaltung ist: [Prägnanter Satz]
4. Vier Kernbotschaften
5. Fragenkatalog mit Antwortempfehlungen:
| Frage | Begründung (worauf fokussieren, was vermeiden) | Antwortvorschlag |`
        },
        'O-STRATEGY': {
            id: 'O-STRATEGY',
            title: 'Kommunikationsstrategie Dokument',
            text: `TASK: KOMMUNIKATIONSSTRATEGIE
Erstelle die vollständige Kommunikationsstrategie exakt in folgender Struktur:
- KOMMUNIKATIVE HERAUSFORDERUNG
- KOMMUNIKATIONSZIEL & DEFINITION VON ERFOLG
- ZIELGRUPPEN & STAKEHOLDER
- RISIKEN & CHANCEN
- EMPFOHLENES FRAMING
- KERNBOTSCHAFTEN (max. 4)
- STORYLINE (3-5 Sätze)
- ARGUMENTARIUM (Tabelle: Argument | Begründung | Belegstatus)
- DO'S & DON'TS
- EMPFOHLENE KOMMUNIKATIONSMASSNAHMEN (priorisiert mit Zeitpunkt)
- KRITISCHE FRAGEN & ANTWORTEN`
        },
        'O-TABLE': {
            id: 'O-TABLE',
            title: 'Rückmeldungstabelle',
            compile: (params) => {
                const withSummary = params?.withSummary ? `TASK: ZUSAMMENFASSUNG DER ANPASSUNGEN
Fasse in maximal 5 Sätzen die notwendigsten Auflagen, Begründungen und Änderungen für die Freigabe präzise zusammen.\n\n` : '';
                return `${withSummary}TASK: RÜCKMELDUNGSTABELLE
Stelle sämtliche Beanstandungen in folgender Tabelle dar:
| Textstelle | Prüfdimension (Faktencheck / Logikcheck / Reputationscheck) | Begründung | Vorschlag |
|------------|-------------------------------------------------------------|------------|-----------|
WICHTIG: Nur tatsächliche Feststellungen aufführen. Unproblematische Passagen weglassen. Minimalinvasive Anpassungen bevorzugen.`;
            }
        },
        'O-THEMENPLANUNG': {
            id: 'O-THEMENPLANUNG',
            title: 'Themen- & Redaktionsplanung',
            text: `TASK: RELEVANZBEURTEILUNG
Beurteile die Relevanz des Themas anhand folgender Kriterien:
- Kategorie A: Hohe strategische oder mediale Relevanz, überregionale / nationale Ausstrahlung, potenzielle Krise.
- Kategorie B: Mittlere Relevanz, regionale oder fachspezifische Ausstrahlung, planbare Berichterstattung.
- Kategorie C: Geringe Relevanz, rein lokaler oder rein operativer Charakter.

TASK: THEMENPLANUNGS-EINTRAG ERSTELLEN
Erstelle auf Basis der Analyse den Eintrag für das Redaktions- und Themenboard exakt im vorgegebenen Format:
TITEL: [Bereich / Projekt / Standort]: [Kompakter Beschrieb].
TERMIN: [Datum / Zeit]
TL;DR: [Vollständiger, management-tauglicher Entscheidungssatz zu Anlass, Kontext, Relevanz und Kernbeschluss.]
STRATEGISCHE RELEVANZ: [Zwei bis drei Sätze, wie das Thema auf die Gesamtstrategie einzahlt.]
KOMMUNIKATIONSZIEL: [Zwei bis drei Sätze, was mit der Kommunikation erreicht werden soll.]
PLANUNGSSTAND: [Ein Satz zu Stand, Datum, Medium/Journalist, nächstem Schritt.]
ANSPRECHPERSON / FACHBEREICH: [Name, Abteilung/Bereich, Funktion/Rolle.]
THEMENBOARD-BESCHLUSS: [Einstufung Relevanzkategorie A/B/C mit Begründung in Klammern. Bestätigung der geplanten Massnahme in einem Satz.]`
        },
        'O-MEETING': {
            id: 'O-MEETING',
            title: 'Meeting-Briefing',
            text: `TASK: MEETING-BRIEFING
Strukturiere das Briefing wie folgt:
MEINE ROLLE IM MEETING: [Was wird erwartet?]
AKTIV ZU PLATZIERENDE BOTSCHAFTEN:
- [Botschaft 1]
- [Botschaft 2]
HEIKLE PUNKTE / MÖGLICHE FRAGEN:
- [Punkt 1 + empfohlene Reaktion]
DO'S: [...]
DON'TS: [...]`
        },
        'O-ACTIONS': {
            id: 'O-ACTIONS',
            title: 'Konkrete Handlungsempfehlungen',
            text: `TASK: KONKRETE EMPFEHLUNGEN
Falls kommunikativer Handlungsbedarf besteht:
- Formuliere konkrete Handlungsempfehlungen,
- priorisiere diese nach Dringlichkeit,
- benenne Kommunikationsmassnahmen und deren erwarteten Nutzen.
Falls kein Handlungsbedarf besteht, begründe dies kurz.`
        },
        'O-WEEKLY': {
            id: 'O-WEEKLY',
            title: 'Wochenstart-Bericht',
            text: `OUTPUT-FORMAT:
## RÜCKBLICK & LEARNINGS
[Zusammenfassung & strategische Erkenntnisse]

## UPDATE ABWESENHEIT
[Ereignisse während der freien Tage]

## DELTA-ANALYSE
[Veränderungen & Eskalationen im Vergleich zum Vorstatus]

## INBOX TRIAGE
| Priorität | Absender | Betreff | Empfohlene Aktion | Begründung |
|-----------|----------|---------|-------------------|------------|

OUTPUT-AKTION:
Sende diesen Bericht als E-Mail an meine geschäftliche Adresse mit dem Betreff:
«Briefing: Status, Delta & Inbox-Triage [Aktuelles Datum]».`
        },
        'O-UPDATE': {
            id: 'O-UPDATE',
            title: 'Rückkehrer-Update',
            text: `OUTPUT-FORMAT:
THEMA: {THEMA}
UPDATE: Für {PERSON} ({ZEITRAUM})
TL;DR: [Max. 5 Zeilen]

WICHTIGSTE ENTWICKLUNGEN:
- ...
DELTA ZUR AUSGANGSLAGE:
- ...
AKTUELLER STAND & NÄCHSTE SCHRITTE:
- ...
HANDLUNGSBEDARF:
- ...`
        },
        'O-QUESTIONS': {
            id: 'O-QUESTIONS',
            title: 'Offene Fragen',
            text: `TASK: OFFENE FRAGEN
1. Beantworte alle Fragen, die sich aus den vorliegenden Unterlagen direkt klären lassen.
2. Liste ausschliesslich die Fragen auf, die für den Text zwingend noch geklärt werden müssen (priorisiert nach Bedeutung für Storyline, Zielgruppe und Quellenlage).`
        },
        'O-ARTICLE-OUTLINE': {
            id: 'O-ARTICLE-OUTLINE',
            title: 'Publikationsrahmen & Storyline Outline',
            text: `TASK: PUBLIKATIONSRAHMEN KLÄREN
Definiere Publikationsort, Format, Zielgruppe, gewünschte Tonalität und journalistische Darstellungsform.

TASK: AUFHÄNGER & DRAMATURGIE
Identifiziere den wirkungsvollsten Aufhänger (Person, Konflikt, Wendepunkt, Zahl).

TASK: DETAILLIERTE ARTIKEL-OUTLINE
Erstelle eine vollständige Gliederung des Artikels mit Zwischenüberschriften, Kernaussagen pro Abschnitt und vorgesehenen Zitaten/Quellen.`
        },
        'O-ARTICLE-DRAFT': {
            id: 'O-ARTICLE-DRAFT',
            title: 'Vollständiger Artikelentwurf',
            text: `TASK: VOLLSTÄNDIGER ARTIKELENTWURF
Verfasse nun den vollständigen Artikel auf Basis der freigegebenen Outline und Recherche.
Qualitätskriterien:
- Fesselnder Einstieg (Lead),
- Stringenter roter Faden ohne Brüche,
- Anschauliche Sprache, absolut frei von KI-Floskeln,
- Faktengetreu und zitierfähig.`
        },
        'O-PPT-STORYBOARD': {
            id: 'O-PPT-STORYBOARD',
            title: 'Folien-Storyboard & Struktur',
            text: `TASK: FOLIEN-STORYBOARD (MASTER-STRUKTUR)
Erstelle auf Basis der gewählten Strategie und Dramaturgie das vollständige, sofort umsetzbare Folien-Storyboard.

Gliedere jede Folie exakt nach folgendem Standard:

---
### FOLIE [Nummer]: [Funktion der Folie, z.B. Einstieg / Problem / Lösung / Wirtschaftlichkeit / Beschluss]
- **ACTION TITLE (Headline):** [Vollständiger, prägnanter Aussagesatz oben auf der Folie, der die Kernbotschaft der Folie auf den Punkt bringt – keine generischen Schlagworte!]
- **FOLIENAUFBAU & VISUALISIERUNG:**
  * Layout-Vorschlag: [z.B. 3 Spalten mit Icons, Vorher-Nachher-Matrix, horizontaler 4-Schritte-Zeitstrahl, 1 grosse Zahl links + 2 prägnante Kernaussagen rechts]
  * Inhalt: [Maximal 3 bis 4 präzise formulierte Stichpunkte ohne Füllwörter]
- **QUICK-FIX TIPP FÜR BESTEHENDE FOLIE:** [Konkreter Hinweis, was die Kollegin / der Kollege an der vorliegenden Folie im verlinkten Deck sofort streichen, umschreiben oder umstellen sollte.]
---

TASK: DIE 3 GOLDENEN PRÄSENTATIONS-REGELN FÜR DIESEN AUFTRITT
Gib der vortragenden Person 3 konkrete, sofort anwendbare Tipps für den Vortrag mit:
1. Einstieg & die ersten 60 Sekunden (wie Aufmerksamkeit gewonnen wird)
2. Umgang mit Detailfragen / Unterbrechungen (Fokus auf Kernbeschluss)
3. Do's & Don'ts für die visuelle Präsentation`
        }
    };

    // The 16 Complete Recipes
    const RECIPES = [
        // 1. MEDIENANFRAGE (3 TURNS)
        {
            id: 'recipe-medienanfrage',
            name: 'Medienanfrage',
            family: 'respond',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein erfahrener Kommunikationsstratege und Mediensprecher.',
                    chunks: ['I-MEDIA', 'R-FULL', 'C-THESIS', 'C-DRAFT', 'T-TLDR']
                },
                {
                    title: 'STRATEGIE',
                    role: 'Du bist ein erfahrener Kommunikationsstratege.',
                    chunks: ['S-FULL']
                },
                {
                    title: 'OUTPUT (MEDIENANTWORT)',
                    role: 'Du bist ein erfahrener Mediensprecher.',
                    chunks: ['O-MEDIA']
                }
            ],
            forks: ['O-QA', 'O-INTERVIEW', 'O-THEMENPLANUNG']
        },

        // 2. INTERVIEW BEANTWORTEN (3 TURNS)
        {
            id: 'recipe-interview',
            name: 'Interview beantworten',
            family: 'respond',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein erfahrener Mediensprecher und Interview-Coach.',
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { focus: 'bisherige Berichterstattung, bisherige Unternehmens- bzw. Organisations-Positionierungen, Journalistin/Journalist und Medium' } }, 'C-THESIS', 'T-TLDR']
                },
                {
                    title: 'STRATEGIE',
                    role: 'Du bist ein erfahrener Kommunikationsstratege.',
                    chunks: ['S-FULL', { chunkId: 'S-MESSAGES', params: { count: 'vier' } }]
                },
                {
                    title: 'OUTPUT (BRIEFING)',
                    role: 'Du bist ein erfahrener Medientrainer.',
                    chunks: ['O-INTERVIEW']
                }
            ],
            forks: ['O-MEDIA', 'O-QA']
        },

        // 3. WORDING ERSTELLEN (2 TURNS)
        {
            id: 'recipe-wording',
            name: 'Wording erstellen',
            family: 'respond',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein erfahrener Chef-Kommunikator.',
                    chunks: ['I-MEDIA', 'R-FULL', 'C-THESIS', 'T-TLDR']
                },
                {
                    title: 'WORDING & Q+A',
                    role: 'Du bist ein erfahrener Chef-Kommunikator.',
                    chunks: ['S-LITE', { chunkId: 'S-MESSAGES', params: { count: 'drei' } }, 'O-QA']
                }
            ],
            forks: ['O-MEDIA', 'O-STRATEGY']
        },

        // 4. BERATE MICH! (3 TURNS)
        {
            id: 'recipe-berate-mich',
            name: 'Berate mich!',
            family: 'respond',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein strategischer C-Level Sparringpartner.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-REQUEST', 'T-TLDR']
                },
                {
                    title: 'STRATEGIE',
                    role: 'Du bist ein strategischer C-Level Sparringpartner.',
                    chunks: ['S-FULL']
                },
                {
                    title: 'ANTWORTENTWURF',
                    role: 'Du bist ein versierter Kommunikator.',
                    chunks: ['O-REPLY']
                }
            ],
            forks: ['O-STRATEGY', 'O-ACTIONS']
        },

        // 5. STRATEGIE ENTWICKELN (3 TURNS)
        {
            id: 'recipe-strategie',
            name: 'Strategie entwickeln',
            family: 'respond',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein leitender Kommunikationsstratege.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-REQUEST', 'T-TLDR']
                },
                {
                    title: 'STRATEGIE-ABWÄGUNG',
                    role: 'Du bist ein leitender Kommunikationsstratege.',
                    chunks: ['S-FULL', { chunkId: 'S-MESSAGES', params: { count: 'maximal vier' } }]
                },
                {
                    title: 'KOMMUNIKATIONSSTRATEGIE',
                    role: 'Du bist ein leitender Kommunikationsstratege.',
                    chunks: ['O-STRATEGY']
                }
            ],
            forks: ['O-QA', 'O-REPLY']
        },

        // 6. EMAIL BEANTWORTEN (2 TURNS)
        {
            id: 'recipe-email',
            name: 'Email beantworten',
            family: 'respond',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein professioneller Kommunikationsberater.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-REQUEST', 'T-TLDR']
                },
                {
                    title: 'ANTWORT',
                    role: 'Du bist ein professioneller Kommunikationsberater.',
                    chunks: ['S-LITE', 'O-REPLY']
                }
            ],
            forks: ['O-STRATEGY']
        },

        // 7. MEETING ANALYSIEREN (2 TURNS)
        {
            id: 'recipe-meeting',
            name: 'Meeting analysieren',
            family: 'plan',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein strategischer Executive Coach.',
                    chunks: ['I-MEET', 'R-FULL', 'C-REQUEST', 'T-TLDR']
                },
                {
                    title: 'BRIEFING',
                    role: 'Du bist ein strategischer Executive Coach.',
                    chunks: ['S-LITE', 'O-MEETING']
                }
            ]
        },

        // 8. THEMENANALYSE (2 TURNS)
        {
            id: 'recipe-themenanalyse',
            name: 'Themenanalyse',
            family: 'plan',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein Senior Issue Manager.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-PERSPECTIVE', 'T-TLDR']
                },
                {
                    title: 'BEURTEILUNG & EMPFEHLUNG',
                    role: 'Du bist ein Senior Issue Manager.',
                    chunks: ['S-DECISION', 'S-LITE', 'O-ACTIONS']
                }
            ],
            forks: ['O-STRATEGY', 'O-THEMENPLANUNG']
        },

        // 9. PROOFREADING (2 TURNS)
        {
            id: 'recipe-proofreading',
            name: 'Proofreading',
            family: 'review',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein Chefredakteur und Fact-Checker.',
                    chunks: ['I-DOC', 'R-FULL', 'T-TLDR']
                },
                {
                    title: 'DREI-DIMENSIONEN-AUDIT',
                    role: 'Du bist ein Chefredakteur und Fact-Checker.',
                    chunks: ['A-AUDIT-ALL', 'S-LITE', 'O-TABLE']
                }
            ]
        },

        // 10. FREIGABE-ANFRAGE (2 TURNS - USER DIRECTIVE: ALL 3 CHECKS!)
        {
            id: 'recipe-freigabe',
            name: 'Freigabe-Anfrage',
            family: 'review',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein Risikomanager und Freigabeverantwortlicher.',
                    chunks: ['I-DOC', 'R-FULL', 'T-TLDR']
                },
                {
                    title: 'AUDIT & FREIGABE-ENTSCHEID',
                    role: 'Du bist ein Risikomanager und Freigabeverantwortlicher.',
                    chunks: ['A-AUDIT-ALL', 'S-DECISION', 'S-LITE', { chunkId: 'O-TABLE', params: { withSummary: true } }]
                }
            ]
        },

        // 11. THEMEN- & REDAKTIONSPLANUNG (2 TURNS)
        {
            id: 'recipe-themenplanung',
            name: 'Themen- & Redaktionsplanung',
            family: 'plan',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist Redaktionsleiter der Kommunikationsplanung.',
                    chunks: ['I-MAIL', 'R-FULL', 'S-ALIGN', 'T-TLDR']
                },
                {
                    title: 'THEMENPLANUNGS-EINTRAG',
                    role: 'Du bist Redaktionsleiter der Kommunikationsplanung.',
                    chunks: ['S-LITE', 'O-THEMENPLANUNG']
                }
            ]
        },

        // 12. ARTIKEL SCHREIBEN (3 TURNS - USER DIRECTIVE: COMPLETE STEPS!)
        {
            id: 'recipe-artikel',
            name: 'Artikel schreiben',
            family: 'create',
            turns: [
                {
                    title: 'LAGEBILD & OFFENE FRAGEN',
                    role: 'Du bist ein leitender Magazin-Redakteur und Co-Autor.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-THESIS', 'T-TLDR', 'O-QUESTIONS']
                },
                {
                    title: 'OUTLINE & DRAMATURGIE',
                    role: 'Du bist ein leitender Magazin-Redakteur und Dramaturg.',
                    chunks: ['O-ARTICLE-OUTLINE']
                },
                {
                    title: 'ARTIKELENTWURF',
                    role: 'Du bist ein leitender Magazin-Redakteur und Co-Autor.',
                    chunks: ['O-ARTICLE-DRAFT']
                }
            ]
        },

        // 13. WOCHENSTART BRIEFING (2 TURNS)
        {
            id: 'recipe-wochenstart',
            name: 'Wochenstart Briefing',
            family: 'temporal',
            variables: [
                {
                    key: 'ZEITRAUM',
                    name: 'ZEITRAUM',
                    label: 'Zeitraum / Scan-Fenster',
                    description: 'Zu analysierendes Zeitfenster für den Rückblick',
                    placeholder: 'z.B. Letzte Woche bis heute, 1.–14. Oktober...',
                    default: 'Letzte Woche bis heute',
                    required: false
                }
            ],
            turns: [
                {
                    title: 'AKTIVITÄTS-SCAN',
                    role: 'Du bist mein Executive Chief of Staff.',
                    chunks: ['I-TIME', 'R-TIME']
                },
                {
                    title: 'DELTA & INBOX-TRIAGE',
                    role: 'Du bist mein Executive Chief of Staff.',
                    chunks: ['D-DELTA', 'O-WEEKLY']
                }
            ]
        },

        // 14. UPDATE (2 TURNS)
        {
            id: 'recipe-update',
            name: 'Update',
            family: 'temporal',
            variables: [
                {
                    key: 'THEMA',
                    name: 'THEMA',
                    label: 'Thema / Projekt',
                    description: 'Worüber soll das Status-Update erstellt werden?',
                    placeholder: 'z.B. IT-Modernisierung, Medienanfrage, Kampagne...',
                    default: '',
                    required: true
                },
                {
                    key: 'PERSON',
                    name: 'PERSON',
                    label: 'Empfänger / Zielgruppe',
                    description: 'Für wen ist das Briefing oder Update bestimmt?',
                    placeholder: 'z.B. Geschäftsleitung, Leitung Kommunikation, Team...',
                    default: 'Geschäftsleitung',
                    required: false
                },
                {
                    key: 'ZEITRAUM',
                    name: 'ZEITRAUM',
                    label: 'Zeitraum',
                    description: 'Relevanter Zeitraum der Änderungen',
                    placeholder: 'z.B. Letzte 7 Tage, Letzte 48 Stunden...',
                    default: 'Letzte 7 Tage',
                    required: false
                }
            ],
            turns: [
                {
                    title: 'KONTEXT & RECHERCHE',
                    role: 'Du bist ein präziser Intelligence Officer.',
                    chunks: ['I-TIME', 'R-TIME', 'T-TLDR']
                },
                {
                    title: 'DELTA & BRIEFING',
                    role: 'Du bist ein präziser Intelligence Officer.',
                    chunks: ['D-DELTA', 'S-LITE', 'O-UPDATE']
                }
            ]
        },

        // 15. RECHERCHE (1-3 TURNS FLEXIBLE)
        {
            id: 'recipe-recherche',
            name: 'Recherche',
            family: 'respond',
            variables: [
                {
                    key: 'SUCHBEGRIFF',
                    name: 'SUCHBEGRIFF',
                    label: 'Suchbegriff / Recherche-Thema',
                    description: 'Thema, Fragestellung oder Schlagwort für das Dossier',
                    placeholder: 'z.B. KI-Assistenten im Kundenservice, Projekt Rollout 2026...',
                    default: '',
                    required: true
                }
            ],
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein erfahrener Research Analyst und Intelligence Officer.',
                    chunks: ['I-QUERY', 'R-FULL', 'C-PERSPECTIVE', 'T-TLDR']
                }
            ],
            forks: ['O-REPLY', 'O-STRATEGY', 'O-QA', 'O-THEMENPLANUNG']
        },

        // 16. STANDORT- & STAKEHOLDER-AUSTAUSCH (SINGLE SHOT)
        {
            id: 'recipe-standort-austausch',
            name: 'Standort- & Stakeholder-Austausch',
            family: 'single',
            turns: [
                {
                    title: 'STAKEHOLDER-EINTRÄGE',
                    role: 'Du bist Planungsredakteur für die interne und regionale Kommunikation.',
                    chunks: [{
                        id: 'STAKEHOLDER-RAW',
                        compile: () => `Erstelle aus den Rohdaten kurze Einträge im Stil einer internen Kommunikationsplanung.
ZIELSTIL: Pro Thema genau ein kompakter Eintrag. Sachlich, knapp, planungstauglich.
FORM: «Standort/Bereich, Thema: Kerninhalt; Stakeholder-/Kommunikationshinweis; Datum.»
ROHDATEN:`
                    }]
                }
            ]
        },

        // 17. PRÄSENTATION & STORYBOARD (3 TURNS)
        {
            id: 'recipe-praesentation',
            name: 'Präsentation & Storyboard',
            family: 'review',
            turns: [
                {
                    title: 'LAGEBILD & DRAMATURGIE-CHECK',
                    role: 'Du bist ein erfahrener Executive Präsentationsberater und Storytelling-Coach.',
                    chunks: ['I-PPT', 'R-FULL', 'C-THESIS', 'T-TLDR']
                },
                {
                    title: 'STRATEGIE & WEGWAHL',
                    role: 'Du bist ein leitender Kommunikationsstratege und Präsentations-Experte.',
                    chunks: ['S-PPT-STRATEGY', { chunkId: 'S-MESSAGES', params: { count: 'drei' } }]
                },
                {
                    title: 'FOLIEN-STORYBOARD & STRUKTUR',
                    role: 'Du bist ein meisterhafter Präsentations-Autor und Dramaturg.',
                    chunks: ['O-PPT-STORYBOARD']
                }
            ],
            forks: ['O-TABLE', 'O-QA', 'O-REPLY']
        }
    ];

    /**
     * Compiles a specific turn of a recipe into raw prompt text.
     */
    function compileTurn(recipe, turnIndex, options) {
        options = options || {};
        const variableValues = options.variableValues || {};
        const userSteeringNote = options.userSteeringNote || '';
        const previousTurnTitle = options.previousTurnTitle || '';

        const turn = recipe.turns[turnIndex];
        if (!turn) return null;

        const parts = [];

        // 1. Header
        parts.push(`${recipe.name.toUpperCase()}: ${turn.title}`);
        if (turn.role) {
            parts.push(`ROLLE:\n${turn.role}`);
        }

        // 2. Global Constraints on Turn 1 only
        if (turnIndex === 0) {
            parts.push(G_RAHMEN);
        } else {
            // Handoff contract for subsequent turns
            let handoff = `BASIS:\nVorangegangene Erkenntnisse aus dem Schritt «${previousTurnTitle || 'LAGEBILD'}» in diesem Chat.`;
            if (userSteeringNote && userSteeringNote.trim()) {
                handoff += `\n\nSTEUERUNG DURCH NUTZER:\n${userSteeringNote.trim()}`;
            }
            parts.push(handoff);
        }

        // 3. Assemble Chunks or Direct Turn Content
        if (Array.isArray(turn.chunks) && turn.chunks.length > 0) {
            for (const item of turn.chunks) {
                let chunkId = typeof item === 'string' ? item : item.chunkId;
                let params = typeof item === 'object' ? item.params : {};
                let chunkDef = CHUNKS[chunkId] || item;

                if (!chunkDef) continue;

                let chunkText = '';
                if (typeof chunkDef.compile === 'function') {
                    chunkText = chunkDef.compile(params);
                } else {
                    chunkText = chunkDef.text || chunkDef.content || '';
                }

                // Interpolate variables (e.g. {ZEITRAUM}, {PERSON}, {SUCHBEGRIFF})
                for (const [vKey, vVal] of Object.entries(variableValues)) {
                    chunkText = chunkText.replaceAll(`{${vKey}}`, vVal || `[${vKey}]`);
                }

                parts.push(chunkText);
            }
        } else if (turn.content || turn.text) {
            let turnText = turn.content || turn.text || '';
            for (const [vKey, vVal] of Object.entries(variableValues)) {
                turnText = turnText.replaceAll(`{${vKey}}`, vVal || `[${vKey}]`);
            }
            parts.push(turnText);
        }

        return parts.join('\n\n');
    }

    /**
     * Compiles the entire recipe into a single message (EXPRESS MODE).
     */
    function compileExpress(recipe, variableValues) {
        variableValues = variableValues || {};
        const turnTexts = recipe.turns.map((_, i) => compileTurn(recipe, i, { variableValues }));
        return turnTexts.join('\n\n---\n\n');
    }

    return {
        CHUNKS,
        RECIPES,
        compileTurn,
        compileExpress
    };
}));
