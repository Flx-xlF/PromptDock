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

    // Global constraints block prepended to Turn 1 (Analysis & Fact-Checking)
    const G_RAHMEN = `RAHMENBEDINGUNGEN:
- Keine leeren Phrasen, Füllwörter oder KI-typischen Formulierungen. Jeder Satz muss Informationsgehalt haben.
- Unterscheide strikt zwischen gesicherten Fakten (mit kurzer Nennung der Quelle aus Mailverlauf, SharePoint/Graph oder Anhang), plausiblen Annahmen und Bewertungen.
- Fehlende Daten oder Informationslücken explizit als «[Offen / Zu prüfen]» benennen, niemals überspielen oder hinzuerfinden.`;

    // Compact style & quality discipline for Turn 2+ (Strategy & Output drafting) and Forks
    const G_OUTPUT_STYLE = `QUALITÄTS- & STILVORGABE:
- Keine leeren Phrasen, Füllwörter oder KI-typischen Formulierungen. Präzise, adressatengerechte Sprache.
- Fakten- und Strategietreue: Stütze dich strikt auf die gesicherten Erkenntnisse; markiere offene Punkte bei Bedarf mit «[Offen / Zu prüfen]».
- Redundanz-Sperre: Wiederhole bereits in Vorstufen festgelegte Analysen oder Herleitungen nicht erneut, sondern wende sie direkt auf das konkrete Arbeitsprodukt an.`;

    // Atomic Chunk Definitions
    const CHUNKS = {
        // --- INTAKE ADAPTERS ---
        'I-MEDIA': {
            id: 'I-MEDIA',
            title: 'Inhalts-Analyse & Triage (Medien/Fragen)',
            text: `TASK: FRAGENKATALOG, TYPOLOGIE & THESEN-CHECK
Analysiere die Medienanfrage im Mailtext sowie allfällige Anhänge/Links:
1. **Kernfrage & Teilfragen:** Isoliere das übergeordnete Thema, alle expliziten/impliziten Teilfragen (nummeriert) sowie Fristen/Deadlines.
2. **Fragen-Typologie & Stossrichtung:** Handelt es sich um eine sachliche Routineanfrage oder um kaskadierende, suggestive bzw. kritische Fragen? Welches Narrativ (Storyline) verfolgt der Journalist?
3. **Zuständigkeits-, Thesen- & Rohmaterial-Check:** Liegen Eigentum, Verfahrenslead oder Auftrag bei uns oder bei Dritten (z.B. Bund, Gemeinde, Kanton, Partner, Mieter)? Prüfe Vorannahmen der Anfrage sowie mitgelieferte Fach-Inputs/Entwürfe im Thread auf internen Jargon, unnötige Exposition und Angriffsflächen.

TASK: ABKLÄRUNGS-TRIAGE (AUFWAND-MINIMIERUNG)
Beschränke den internen Abklärungsaufwand in den Fachbereichen auf das absolute Minimum. Ordne jede Frage nach dem internen Faktenabgleich einer von drei Kategorien zu:
1. **DIREKT BEANTWORTBAR (OHNE RÜCKFRAGE):** Sofort aus Mailverlauf, M365-Wissensquellen (SharePoint/Graph) oder auf übergeordneter Flughöhe beantwortbar (Priorität: maximal hier bündeln!).
2. **BEWUSST NICHT INTERN ABKLÄREN (DETAILFALLE):** Granulare oder suggestive Teilfragen, die unnötig Fachressourcen binden und durch eine übergeordnete Kernaussage souverän abgedeckt werden.
3. **ZWINGENDER MINIMAL-CHECK (BLOCKER):** Maximal 1–2 unverzichtbare Faktenlücken – formuliert als geschlossene Ja/Nein-Prüffrage an die Fachstelle (keine offenen Rechercheaufträge!).`
        },
        'I-MAIL': {
            id: 'I-MAIL',
            title: 'Inhalts-Analyse (E-Mail/Vorgang)',
            text: `TASK: INHALTS-, THREAD- & AUFTRAGSANALYSE (OUTLOOK)
Analysiere den E-Mail-Verlauf (Chronologie von unten nach oben) sowie allfällige Anhänge/Dokumente nach den drei Ebenen **Sache, Ermessen und Form**:
- **Eigentlicher Auftrag & Adressatenkreis:** Sucht die anfragende Person eine **interne Einschätzung/Linie** («Was meinst du? Soll man überhaupt reagieren?»), eine **Direktantwort** oder einen **direkt verwendbaren Textentwurf für Dritte** (z.B. Anwohnende/Betroffene, Behörden/Partner, Lieferanten)?
- **Zuständigkeit, Verfahrenslead & Historie:** Was ist bisher passiert, bei wem liegt der Verfahrenslead bzw. Auftrag (z.B. Bund, Gemeinde, Partner vs. unsere Rolle), und von welchem konkreten Meilenstein oder Entscheid hängt eine Aussage ab?
- **Rohmaterial vs. gesicherte Fakten:** Welche Angaben im Thread sind belastbare Fakten/Termine – und wo enthält mitgeliefertes Fach-Rohmaterial internen Jargon, ungesicherte Zahlen oder Formulierungen, die uns unnötig exponieren?`
        },
        'I-DOC': {
            id: 'I-DOC',
            title: 'Inhalts-Analyse (Dokumenten-, Setting- & Folienprüfung)',
            text: `TASK: PUBLIKATIONSSETTING, ZIELPUBLIKUM & FAKTENGRENZEN-ANALYSE
Analysiere die verlinkte/angehängte Datei (Textentwurf, Beitrag, Präsentation, Q&A) samt E-Mail-Verlauf:
1. **Publikationssetting & Drei-Stufen-Zielpublikum:**
   - **Setting & Auftrag:** Kläre vorab Format und Absenderinteresse (*Behörden-/Gremienvorlage* vs. *Paid Content / Jubiläums- oder Unternehmenspublikation / Partnerschaft* vs. *unabhängiger Medienbeitrag*; falls nicht eindeutig erkennbar, naheliegendste Einordnung transparent als Annahme benennen).
   - **Zielpublika:** (a) **Primäres Zielpublikum** (inkl. Erwartung an Vollzugsstand/Nachweise bzw. Lesewert), (b) **Sekundäres Zielpublikum** (Medien/Öffentlichkeit – verständlich & isoliert zitierbar), (c) **Empfänger unserer Rückmeldung** (Absender/Verfassende im Thread).
2. **Strategische Konzept- & Rollenpassung:** Passt das Text-/Folienkonzept grundsätzlich zum Publikationssetting und wird die eigentliche Kernrolle bzw. Gesamtleistung unserer Organisation zutreffend eingeordnet (statt verkürzt oder verzerrt dargestellt)?
3. **Faktengrenzen & Risiken:** Trenne gesicherte Tatsachen/Beobachtungen von unbelegten Kausalitäten, fehlenden Vollzugsständen und unbelegten Zeit-/Optionsversprechen.`
        },
        'I-PPT': {
            id: 'I-PPT',
            title: 'Kontext-, Zielgruppen- & Deck-Analyse (Präsentation)',
            text: `TASK: MODUS, ZIELGRUPPE & ENTSCHEIDUNGS-PSYCHOLOGIE
Analysiere den E-Mail-Verlauf sowie verlinkte/angehängte Dokumente oder Folien (SharePoint, OneDrive, Anhang):
1. **Arbeitsmodus:** Bestimme, ob **MODUS A (Neukonzeption aus Kontext ohne bestehende PPT)** oder **MODUS B (Originalnahes Review/Upgrade eines bestehenden Foliendecks inkl. allfälliger Q&A-Folien)** vorliegt.
2. **Zielpublika (Primär vs. Sekundär):** Wer ist das primäre Zielpublikum (z.B. Gremium, Behörde/Amt – welche Nachweise, Zuständigkeiten und konkreten Vollzugsstände erwartet es?) und wie wirkt die Vorlage sekundär auf Öffentlichkeit/Medien?
3. **Der «Elefant im Raum»:** Welcher Vorbehalt, Zielkonflikt oder fehlende Umsetzungsnachweis gefährdet die Akzeptanz am stärksten?

TASK: SUBSTANZ-, VOLLZUGS- & BELASTBARKEITS-PRÜFUNG (LEAK-TEST)
- **Substanz- & Faktengrenzen-Diagnose:**
  * *Bei MODUS A:* Extrahiere die gesicherten Fakten, Zahlen und offenen Lücken für Situation (S), Komplikation (C), Kernfrage (Q) und Antrag (A).
  * *Bei MODUS B:* Prüfe Folie für Folie (inkl. Q&A) direkt gegen den Originaltext auf Wiederholungen, fehlenden konkreten Umsetzungsstand, Inside-out-Prozesssprache und unbelegte Kausalitäten oder Zeitversprechen.
- **Outside-in- & Leak-Test:** Welche Aussagen wären isoliert zitiert (Medien-Leak, Öffentlichkeitsgesetz, Aufsicht) ohne Fachwissen unverständlich, rechtfertigend oder als unbelegtes Versprechen angreifbar?`
        },
        'I-MEET': {
            id: 'I-MEET',
            title: 'Inhalts-Analyse (Meeting)',
            text: `TASK: TERMIN-, KONTEXT- & ANLIEGENSANALYSE
Analysiere den Termin inkl. Einladungstext sowie verlinkter oder angehängter Dateien:
- **Zweck, Agenda & Akteure:** Was ist das Ziel des Meetings, welche Themen stehen an und wer nimmt in welcher Rolle teil?
- **Mein Mandat & Erwartung:** Welcher konkrete Beitrag wird von mir erwartet (Entscheidung, Input, Freigabe) und welche heiklen Punkte könnten mich überraschen?`
        },
        'I-QUERY': {
            id: 'I-QUERY',
            title: 'Inhalts-Analyse (Suchintention)',
            text: `SUCHBEGRIFF / SUCHSATZ:
{SUCHBEGRIFF}

TASK: INHALTS-ANALYSE & SUCHINTENTION
Analysiere den Suchbegriff/-satz sowie allfällige Dateien. Bestimme:
- die Kernfrage und Teilfragen,
- den Informationsbedarf und Nutzungskontext,
- die mutmassliche Handlung oder Entscheidung, die unterstützt werden soll.`
        },
        'I-TIME': {
            id: 'I-TIME',
            title: 'Zeitfenster-Fokus',
            compile: (params) => {
                const withTopic = params?.withTopic === true;
                return withTopic
                    ? `PARAMETER & FOKUS:\n- **Thema / Projekt:** {THEMA}\n- **Zielgruppe / Empfänger:** {PERSON}\n- **Analyse-Zeitraum:** {ZEITRAUM} (inkl. Vergleich Beginn des Zeitfensters bis heute)`
                    : `PARAMETER & FOKUS:\n- **Analyse-Zeitraum:** {ZEITRAUM} (Rückblick, Entwicklungen in Zwischen-/Abwesenheitstagen und aktueller Stand bis heute)`;
            }
        },

        // --- RESEARCH CHUNKS ---
        'R-FULL': {
            id: 'R-FULL',
            title: 'Recherche (Microsoft Graph, SharePoint & Web)',
            compile: (params) => {
                const isMedia = params?.scope === 'media';
                const defaultFocus = isMedia
                    ? 'bisherige mediale Berichterstattung, öffentlich verfügbare Fakten, frühere Stellungnahmen und historische Kontexte'
                    : 'relevante Hintergrundfakten, Projektstände, bisherige Entscheidungen, Sprachregelungen und organisatorische Zusammenhänge';
                const focus = params?.focus || defaultFocus;
                return `TASK: RECHERCHE & FAKTENABGLEICH (M365 GRAPH & KONTEXT)
Durchsuche frühere E-Mails, Teams-Chats, Besprechungsnotizen und SharePoint-Dokumente gezielt nach: ${focus}.
- Gleiche Behauptungen oder Vorannahmen aus der vorliegenden Anfrage aktiv gegen unabhängige interne M365-Quellen ab, statt sie ungeprüft zu übernehmen.
- **Faktenstatus & Konsistenz:** Ordne jede zentrale Aussage eindeutig einer Verbindlichkeitsstufe zu (*fachlich geprüft und beschlossen* | *geplant oder vorgesehen* | *in Prüfung* | *offen [Zu prüfen]* inkl. Quelle). Vermische diese Grade nicht und weise explizit auf Widersprüche zwischen bestätigten Terminen und angeblich noch offenen Zeitpunkten hin.`;
            }
        },
        'R-TIME': {
            id: 'R-TIME',
            title: 'Recherche (Zeitfenster Microsoft Graph)',
            compile: (params) => {
                const withTopic = params?.withTopic === true;
                const topicClause = withTopic ? ` mit engem Bezug zum Thema «{THEMA}» und dem Informationsbedarf von «{PERSON}»` : '';
                return `TASK: AKTIVITÄTS- & KONTEXT-SCAN VIA MICROSOFT GRAPH
Durchsuche alle gesendeten und empfangenen E-Mails, Teams-Chats, Kalendereinträge und SharePoint-Aktivitäten innerhalb des definierten Zeitraums ({ZEITRAUM})${topicClause}.
- Erfasse die wichtigsten Entwicklungen, Entscheidungen, offenen Pendenzen und Eskalationen chronologisch.
- Stütze dich ausschliesslich auf echte Daten aus Microsoft Graph; erfinde keine Einträge hinzu.`;
            }
        },

        // --- CHECK LENSES ---
        'C-THESIS': {
            id: 'C-THESIS',
            title: 'Kritischer Thesen-Check',
            text: `TASK: KRITISCHER THESEN- & PRÄMISSEN-CHECK
Prüfe die zentralen Thesen und Vorannahmen auf ihre tatsächliche Belastbarkeit:
- **Prämissen & Faktencheck:** Welche stillschweigenden Annahmen müssen zutreffen, damit die These hält – und wo widersprechen ihnen Fakten?
- **Stärkstes Gegenargument (Steel Man):** Was ist der gewichtigste sachliche Einwand gegen die vorgetragene Position?
- **Fazit:** Was davon ist gesicherte Tatsache, was legitime Bewertung und was unbelegte Behauptung?`
        },
        'C-REQUEST': {
            id: 'C-REQUEST',
            title: 'Kritischer Sachverhalts-, Ermessens- & Expositions-Check',
            text: `TASK: KRITISCHER SACHVERHALTS-, ERMESSENS- & EXPOSITIONS-CHECK
Prüfe das Anliegen nüchtern auf **Sache, Ermessen und Form**:
- **Berechtigung & Anliegen (Steel Man):** Was ist das legitime Bedürfnis der Anfragenden bzw. Betroffenen (z.B. Planungssicherheit, Betroffenheit vor Ort) – und welche falschen Annahmen oder internen Jargon-Fallen stecken im Vorlauf?
- **Ermessen, Präzedenz & Vorbehalt:** Stehen Aufwand und Ertrag im Verhältnis? Wo drohen Präzedenzfälle, falsche Deutungen, eine Vorfreigabe vor einem zwingenden Meilenstein (z.B. Inbetriebnahme/Behördenentscheid) oder eine falsche Rollenzuweisung (unsere Organisation als vermeintliche Auslöserin statt Auftrag/Verfahrenslead Dritter)?`
        },
        'C-PERSPECTIVE': {
            id: 'C-PERSPECTIVE',
            title: 'Mehrperspektivische Einordnung',
            text: `TASK: KRITISCHE MEHRPERSPEKTIVEN-EINORDNUNG
Ordne das Thema nüchtern aus drei relevanten Risikoperspektiven ein:
- **Medien- & Öffentlichkeits-Blick:** Welcher Aufhänger oder Kritikpunkt wäre für Journalisten am attraktivsten?
- **Politik & Aufsicht:** Welche Fragen, Erwartungen oder Vorbehalte haben Regulatoren und politische Stakeholder?
- **Interne & Reputative Dynamik:** Welche Folgewirkungen oder Präzedenzfälle entstehen für die Organisation?`
        },
        'C-DRAFT': {
            id: 'C-DRAFT',
            title: 'Antwortvorschläge-Check',
            text: `TASK: ANTWORTVORSCHLÄGE-CHECK
Prüfe allfällige bereits vorhandene Antwortentwürfe auf faktische Belastbarkeit, argumentative Schwachstellen und mediale Angriffsflächen (falls kein Entwurf vorliegt, kurz überspringen).`
        },

        // --- TLDR & HANDOFF ---
        'T-TLDR': {
            id: 'T-TLDR',
            title: 'TL;DR & Lagebild-Synthese',
            compile: (params) => {
                const mustInclude = params?.mustInclude || 'Kernfrage, gesicherte Faktenbasis, grösstes Risiko/Vorbehalt';
                return `TASK: MANAGEMENT-SYNTHESE (TL;DR)
Bringe das Lagebild in maximal 4–5 prägnanten Bulletpoints (${mustInclude}) so auf den Punkt, dass ein Entscheidungsträger sofort handlungsfähig ist.`;
            }
        },

        // --- STRATEGY & AUDIT CHUNKS (TURN 2) ---
        'S-FULL': {
            id: 'S-FULL',
            title: 'Strategie-Abwägung & Haltung',
            compile: (params) => {
                const includeFormatAnalysis = params?.includeFormatAnalysis === true;
                const formatBlock = includeFormatAnalysis ? `

TASK: BEANTWORTUNGS-ARCHITEKTUR & PROPORTIONALITÄT
Wähle das Format, das Themenhoheit sichert und den Aufwand proportional hält:
- **Option A (Punkt-für-Punkt):** Bei rein sachlichen, unkritischen Einzelfragen mit klarer Faktenlage.
- **Option B (Kompakte Gesamteinordnung):** Geschlossenes Statement aus eigener Perspektive – ideal, um ein eigenes Narrativ zu setzen, falsche Prämissen/Negativ-Frames abzulösen oder Detailverzettelung zu vermeiden.
- **Option C (Hybrid / Geclustert):** Kurze übergeordnete Einordnung + gebündelte Beantwortung der Sachfragen.
*Entscheide verbindlich (A, B oder C) passend zur Tragweite der Anfrage.*` : '';

                return `TASK: STRATEGIE-OPTIONEN, FRAMING-ZIEL & EIGENES NARRATIV
1. **Strategie-Optionen (proportional zur Anfrage):** Stelle die 2–3 sinnvollsten Reaktionsoptionen (inkl. Chancen, Risiken und stärkstem Einwand) knapp gegenüber.
2. **Framing-Ziel & Schutzgrenzen (Leitplanke):** Lege dich verbindlich fest: Welches **eigene, sachlich überzeugende Narrativ** setzen wir aktiv (statt Vorwürfe oder negative Frames der Anfrage zu reproduzieren), und wo wahren wir strikt unsere Grenzen (Schutz des offenen Lösungsraums, Vertraulichkeit bei Verträgen/Verhandlungen, Abgrenzung fremder Zuständigkeiten)?
3. **Storyline & Hauptargumente:** Skizziere den roten Faden in klarer, verständlicher Logik (*Was gilt / Was tun wir → Warum ist das sachlich sinnvoll → Wie geht es weiter*).${formatBlock}`;
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
                return `TASK: KERNBOTSCHAFTEN (OUTSIDE-IN & ZITIERFÄHIG)
Formuliere ${count} prägnante, isoliert zitierfähige Kernbotschaften (Outside-in: Ziel, Nutzen und eigenes Handlungsnarrativ zuerst; ohne Vorwegnahme offener Entscheide oder unbelegte Versprechen).`;
            }
        },
        'S-DECISION': {
            id: 'S-DECISION',
            title: 'Strategische Vorprüfung & Entscheid',
            compile: (params) => {
                const isIssue = params?.mode === 'issue';
                const focusLine = isIssue
                    ? 'Beurteile zuerst auf Gesamtebene, ob kommunikativer Handlungsbedarf besteht (*aktive Positionierung* vs. *reaktive Bereitschaft / Q&A* vs. *bewusster Verzicht*):'
                    : 'Beurteile zuerst auf Gesamtebene, ob das vorliegende Konzept zum Publikationssetting und zur Rolle unserer Organisation passt (*Konzept stimmig / punktuelle Schärfung* vs. *inhaltliche Neugewichtung* vs. *grundlegende Überarbeitung / Nichtfreigabe*):';
                return `TASK: STRATEGISCHE VORPRÜFUNG & ENTSCHEID\n${focusLine}\nBewerte kurz Vor- und Nachteile, lege dich verbindlich fest und formuliere den Kernentscheid in genau einem prägnanten Satz.`;
            }
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
            title: 'Präsentations-Leitlinie, Prüfkriterien & Folien-Triage',
            text: `TASK: PROZESSDIAGNOSE & STRATEGISCHE LEITLINIE
Prüfe zuerst, ob eine neue Strategie nötig ist oder ob eine erkennbare Linie vorliegt, die konsequent auf die Folien abgeglichen werden muss (wähle den kürzesten belastbaren Weg ohne redundante Zwischenprodukte):
- **Strategische Leitlinie (1 Satz):** Formuliere den tragenden Leitsatz, der den zentralen Zielkonflikt löst (z.B. *gesicherter Bedarf* → *bisherige Vorzugsevaluation* → *ergebnisoffene Machbarkeits-/Detailprüfung*, ohne spätere Entscheide vorwegzunehmen).
- **Dramaturgie-Entscheid:** Wähle bei *MODUS A (Neukonzeption)* die stärkste Dramaturgie (BLUF, SCQA oder Einordnungs-Dramaturgie); entscheide bei *MODUS B (bestehendes Deck)* zwischen *fokussiertem Strategieabgleich am bestehenden Deck* und *strukturellem Redesign*.

TASK: VERDICHTETE PRÜFKRITERIEN (MAX. 5 SPRACH- & INHALTSREGELN)
Übersetze die Leitlinie in höchstens 5 verbindliche Prüfkriterien (inkl. konkreter Sprachregeln «Nicht ‹X›, sondern ‹Y›»):
1. **Stufen-Trennung:** Bedarf, bisherige Evaluation/Präferenz und offenen Realisierungsentscheid strikt trennen; Prüfoptionen (z.B. Mehrfachnutzung) niemals als Versprechen oder Kompensation führen.
2. **Rollen- & Mandatsklarheit:** Unterschiedliche Rollen und Interessen externer Partner (z.B. Stadt, Kanton, Ämter) sauber wahren, statt sie durch ein künstliches «Wir sind uns einig»-Framing zu nivellieren.

TASK: FOLIEN-TRIAGE & HORIZONTALE STORYLINE
- **Bei MODUS A:** Entwirf die fortlaufende Liste aller **Action Titles (ganze, aktive Aussagesätze pro Folie)** als lückenlose Storyline.
- **Bei MODUS B:** Klassifiziere jede Folie verbindlich nach Eingriffstiefe (**stimmig** | **kleinere Anpassung** | **grössere Anpassung** | **entfernen/Reserve**). Bereinige Vermischungen von Hauptpräsentation, Regiefolien, Dubletten und Varianten – lege dich jeweils verbindlich auf **eine** Variante fest (keine offenen Optionslisten).`
        },
        'A-AUDIT-ALL': {
            id: 'A-AUDIT-ALL',
            title: '3D-Audit (Setting-Kalibrierung, Faktengrenzen, Outside-in)',
            text: `TASK: SETTING-GERECHTES DREI-DIMENSIONEN-AUDIT (OHNE SCHEIN-BEANSTANDUNGEN)
Gewichte alle Beanstandungen strikt nach dem konkreten Publikationsauftrag (tragfähige Passagen unverändert belassen, nur entscheidungsrelevante Änderungen vorschlagen):
1. **FAKTENGRENZEN, EVIDENZ-SCHWELLE & VOLLZUG:**
   - **Keine Schein-Beanstandungen:** Beanstande Zahlen, Jahreszahlen oder Grössenordnungen nur dann, wenn eine interne Quelle (Mail/SharePoint/Graph) ihnen nachweislich widerspricht – erzeuge keine spekulativen Pedanterie-Einwände.
   - **Entscheidungsstufen & Vollzug:** Trenne *gesicherten Bedarf/Beobachtung*, *bisherige Präferenz* und *offene Machbarkeit* (Prüfoptionen nie als Versprechen; keine unbelegten Zeitversprechen wie «so rasch wie möglich» ausser als Verfügungs-Zitat; fehlenden Vollzugsstand als Bearbeitungskommentar markieren).
2. **ROLLENKLARHEIT, ZUSPITZUNGEN & TERMINOLOGIE:**
   - Korrigiere insbesondere falsche Rollenzuweisungen (Verfahrenslead/Auftraggeber klar benennen, damit unsere Organisation nicht fälschlich als Auslöserin dasteht; Kernrolle im Gesamtsystem korrekt einordnen), unnötige Zuspitzungen und vage Andeutungen von Problemen. Bereinige Dubletten/Varianten (verbindlich auf **eine** Variante festlegen) und halte Schlüsselbegriffe konsistent (\`Nicht «X», sondern «Y»\`).
3. **SETTING-ANGEMESSENHEIT, OUTSIDE-IN & ZITIERFÄHIGKEIT:**
   - **Glaubwürdigkeit vor PR-Sterilität:** Bei Paid Content, Jubiläums-, Gast- oder Magazinbeiträgen ist lebendige journalistische Sprache und sachlich gedeckte kritische Distanz erwünscht – bekämpfe keinen legitimen journalistischen Stil als «Reputationsrisiko», sondern greife nur dort ein, wo kritische Framings ohne Kontext verstärkt oder Kernleistungen ausgeblendet werden.
   - **Outside-in & Partner-Rollen:** **Ziel, Nutzen & Handlung** zuerst, Rahmenbedingungen danach. Unterschiedliche Rollen externer Partner (Stadt, Kanton, Ämter) sauber trennen.

WICHTIG: Gib keine doppelte Vorab-Mängelliste aus, sondern führe die Ergebnisse direkt in der nachfolgenden Ausgabelogik zusammen.`
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
            title: 'Medienantwort, Begründung & Abschluss-Check',
            text: `TASK: MEDIENANTWORT, KURZBEGRÜNDUNG & ABSCHLUSS-CHECK
Erstelle auf Basis der festgelegten Strategie die versandfertige Medienantwort in exakt diesen drei Schritten:

1. **FRAMING-ZIEL & LEITPLANKE (VORAB, MAX. 3 SÄTZE):**
   - Definiere vor dem Entwurf knapp: Welches **eigene, überzeugende Narrativ** soll hängen bleiben, welche Haltung vermittelt die Antwort, und **was lassen wir aus den internen Inputs bewusst weg** (Schutz von Lösungsraum, Vertraulichkeit, fremder Zuständigkeit)?

2. **MEDIENANTWORT (VERSANDFERTIGER ENTWURF):**
   - **Direkt, menschlich & eigenes Narrativ:** Komm sofort und verständlich auf den Punkt – in natürlicher, nahbarer Sprache ohne Behörden- oder PR-Floskeln. Wiederhole oder verneine niemals Vorwürfe, Reizworte oder negative Frames aus der Anfrage, sondern erkläre aus eigener Kraft sachlich und nachvollziehbar, was gilt, warum es sinnvoll ist und wie es weitergeht. Halte die Länge proportional zur Anfrage.
   - **Faktenstatus & notwendige Konkretion:** Trenne Verbindlichkeitsgrade (*beschlossen* | *geplant* | *in Prüfung* | *offen*) strikt ohne Termin-Widersprüche (allfälligen Einzel-Blocker als «[Kurze Bestätigung durch Fachbereich X: ...]» markieren). Formuliere so konkret wie nötig, aber schütze offenen Lösungsraum durch verständliche Oberbegriffe statt einengender Detailbegriffe.
   - **Klare Satzfunktion:** Jeder Satz erfüllt genau eine Funktion (*Einordnung/Betroffenheit* | *gesicherter Sachstand/Zuständigkeit* | *sachlicher Grund/Haltung* | *Ausblick/Alternative* | *offene Prüfung abgrenzen*). Keine Vermischung verschiedener Stufen im selben Satz, keine Füllsätze.

3. **ABSCHLIESSENDER QUALITÄTS-CHECK (SCHEMA a–d):**
   Prüfe den Entwurf gegen dieses Schema (je 1 kurzer Prüfsatz; bei Verstoss den Entwurf oben vor der Ausgabe direkt korrigieren):
   - **a) Medial & politisch belastbar:** Faktenfest, zuständigkeitskonform und ohne unnötige Selbstbindung?
   - **b) Nahbar, menschlich & verständlich:** Natürlich, zugänglich und frei von bürokratischer Distanz?
   - **c) Keine Reproduktion negativer Frames:** Frei von wiederholten/verneinten Vorwürfen, Reizworten oder Hypothesen der Anfrage?
   - **d) Eigenes Narrativ:** Überzeugt die Antwort aus eigener Logik und Perspektive, statt nur reaktiv Fragen abzuarbeiten?`
        },
        'C-MEDIA-CHECK': {
            id: 'C-MEDIA-CHECK',
            title: 'Medienantwort-Check (Festlegung 1–4 & Schema a–d)',
            text: `TASK: ENTSCHEIDUNGS- UND FESTLEGUNGS-CHECK (VORPRÜFUNG 1–4)
Prüfe vor der sprachlichen Überarbeitung jeden zentralen Inhalt des vorliegenden Medienantwort-Entwurfs nach diesen vier Punkten:
1. **Framing-Ziel, Zuständigkeit & Vertraulichkeit:** Formuliere vorab in einem Satz die Zielhierarchie: Welches eigene Narrativ und welche Haltung soll die Antwort vermitteln, liegt die Zuständigkeit tatsächlich bei uns (oder bei Dritten), und worauf darf sie uns nicht festlegen (Lösungsraum, Vertraulichkeit)?
2. **Faktenstatus:** Ordne jede Aussage eindeutig einer Stufe zu (*fachlich geprüft und beschlossen* | *geplant oder vorgesehen* | *in Prüfung* | *offen*). Vermische diese Verbindlichkeitsgrade nicht und decke Termin-Widersprüche auf.
3. **Notwendige Konkretion:** Prüfe, ob der Text so konkret wie nötig, aber nicht konkreter als der bestätigte Entscheidungsstand ist. Ersetze Begriffe, die den offenen Lösungsraum unnötig einengen, durch verständliche Oberbegriffe.
4. **Satzfunktion:** Prüfe, ob jeder Satz eine eindeutige Funktion erfüllt (*Einordnung/Betroffenheit* | *gesicherter Sachstand* | *sachlicher Grund/Haltung* | *bestätigter Ausblick* | *offene Prüfung abgrenzen*). Streiche Füllsätze und Wiederholungen.

TASK: MEDIALER BELASTBARKEITS- & WIRKUNGS-CHECK (SCHEMA a–d)
Prüfe den Entwurf zudem kompromisslos anhand der vier Wirkungskriterien:
- **a) Antwort ist medial und politisch belastbar:** Hält jede Aussage kritischer Nachprüfung stand, ohne neue Angriffsflächen zu öffnen?
- **b) Antwort ist nahbar, menschlich und verständlich:** Frei von unterkühlter Behörden-, Juristen- oder PR-Floskelsprache?
- **c) Vorwürfe und hypothetische Konfliktszenarien werden weder wiederholt noch indirekt bestätigt:** Werden Unterstellungen, Reizworte oder Spekulationen der Anfrage konsequent gemieden (auch nicht durch defensive Verneinung wiederholt)?
- **d) Antwort liefert eigenes Narrativ:** Setzt die Antwort aktiv unsere Kernbotschaft, statt nur reaktiv fremdes Framing abzuarbeiten?

TASK: ROTSTIFT & VERSANDFERTIGE ENDFASSUNG
1. **Gezielter Rotstift («Statt X → Besser Y»):** Benenne die konkreten Korrekturen aus Vorprüfung (1–4) und Schema (a–d) – insbesondere wo zu enge Detailbegriffe durch Oberbegriffe ersetzt, Verbindlichkeitsgrade korrigiert oder funktionslose Sätze gestrichen wurden.
2. **Versandfertiger Final-Entwurf:** Gib die bereinigte, sofort versandfertige Medienantwort aus, die alle Kriterien restlos erfüllt (inkl. max. 3 Sätzen Begründung der wichtigsten Anpassung).`
        },
        'O-REPLY': {
            id: 'O-REPLY',
            title: 'Antwortentwurf (E-Mail / Textblock für Dritte)',
            text: `TASK: EMPFOHLENE LINIE & VERSANDFERTIGER E-MAIL-ENTWURF
Liefere das Ergebnis passend zum Auftrag (interne Einschätzung, Direktantwort oder Textblock für Dritte):

1. **Interne Einordnung & Empfehlung (Ich-Form, 1–3 Sätze):**
   - Gib eine klare Empfehlung («Aus meiner Sicht…») mit den 2–3 tragenden Gründen (z.B. Aufwand/Ertrag, Präzedenz/Gleichbehandlung, Zuständigkeit/Verfahrenslead, oder was aus dem Rohmaterial bewusst weggelassen wurde) und dem konkreten nächsten Schritt.

2. **Versandfertiger Textblock / E-Mail-Entwurf:**
   - **Bei Texten an Externe / Betroffene / Partner:**
     * *Aufbau & Ton:* Bei Betroffenen/Anwohnenden zuerst Verständnis zeigen ohne Schuldeingeständnis («Wir können nachvollziehen…»), dann gesicherte Fakten/Zeitfenster und eine nachvollziehbare sachliche Begründung (mit Nutzen bzw. objektivem Grund); getrennte Themen getrennt beantworten.
     * *Jargonfrei & objektive Kriterien:* Übersetze Business-Rohmaterial und interne Kriterien in natürliche, verständliche Aussensprache (z.B. «sofern die Arbeiten die vereinbarten Anforderungen erfüllen» statt «wenn alle zufrieden sind»; nachgelagerte Formularpflichten nur kompakt per Verweis bündeln).
     * *Vorbehalt statt Zusage:* Wahrung des Spielraums durch saubere Vorbehalte («nach heutigem Planungsstand», «voraussichtlich», «Die Termine können sich noch verändern») bzw. Nennung des materiellen Meilensteins vor einer Prüfung/Entscheidung.
   - **Bei rein interner Abstimmung / Anlass-Koordination:** Klare Haltung, offene Punkte mit Zuständigkeit und Frist zuordnen, bei Konflikten lösungsorientierten Ablauf (z.B. zuerst klärendes Gespräch, dann Mail) vorschlagen.`
        },
        'O-QA': {
            id: 'O-QA',
            title: 'Q+A Tabelle',
            text: `TASK: KRITISCHES Q+A (8–10 FRAGEN, OUTSIDE-IN & ZITIERFÄHIG)
Erstelle ein kompaktes Q+A mit den 8–10 heikelsten Fragen (Journalisten, Behörden, Stakeholder). *Qualitätsregeln für jede Antwort:* (a) **Outside-in:** Ziel, Schutzgut und eigenes Handlungsnarrativ zuerst, betriebliche Rahmenbedingungen sachlich danach (nie als Ausrede); (b) **Keine Vorwurfswiederholung** aus der Frage; (c) **Faktenstatus & Oberbegriffe:** Keine unbelegten Zeit-/Erfüllungsversprechen («so rasch wie möglich»), bei offener Ausgestaltung verständliche Oberbegriffe nutzen; (d) **Isoliert zitierbar** ohne Fachwissen:
| Kritische Frage | Empfohlene Antwort (Outside-in & isoliert zitierbar) | Begründung der Linie / Abgrenzung |
|-----------------|------------------------------------------------------|-----------------------------------|`
        },
        'O-INTERVIEW': {
            id: 'O-INTERVIEW',
            title: 'Interview- & Medienbriefing',
            text: `TASK: INTERVIEW- UND MEDIENBRIEFING
Erstelle das kompakte, sofort einsatzbereite Interview-Briefing in exakt folgender Struktur:
1. **Ziel, Rahmen & Rolle:** Ziel des Gesprächs und Positionierung unserer Vertretung (2–3 Sätze).
2. **Grundhaltung & Rote Linie (Nicht-Festlegung):** [Prägnanter Leitsatz + klare Grenze, worauf wir uns im Gespräch keinesfalls festlegen]
3. **Vier zitierfähige Kernbotschaften (Outside-in):** [Knapp, nahbar und ohne Fachwissen verständlich]
4. **Fragenkatalog mit Antwortempfehlungen:** (Antworten strikt *Outside-in*: Ziel & Handlung vor Rahmenbedingungen; keine Vorwürfe wiederholen; keine unbelegten Zeitversprechen; Oberbegriffe bei offenen Punkten)
| Kritische Frage | Taktischer Fokus (was betonen / was meiden) | Souveräner Antwortvorschlag (zitierfähig) |`
        },
        'O-STRATEGY': {
            id: 'O-STRATEGY',
            title: 'Kommunikationsstrategie Dokument',
            text: `TASK: KOMPAKTE KOMMUNIKATIONSSTRATEGIE
Erstelle eine fokussierte, entscheidungsreife Kommunikationsstrategie in exakt 6 Kernblöcken:
1. **HERAUSFORDERUNG, ENTSCHEIDUNGSSTAND & ZIEL:** Sachverhalt (getrennt nach *gesichertem Bedarf/Stand*, *bisheriger Präferenz* und *offenen Fragen*) sowie konkretes Kommunikationsziel.
2. **STRATEGISCHE LEITLINIE & NICHT-FESTLEGUNG:** Tragender Leitsatz (1 Satz), eigenes Narrativ und klare Grenze, worauf die Kommunikation die Organisation nicht vorzeitig festlegen darf.
3. **KERNBOTSCHAFTEN & MAX. 5 VERBINDLICHE SPRACHREGELN:** Bis zu 4 zitierfähige Botschaften (Outside-in) plus konkrete Sprach-/Inhaltsregeln («Nicht ‹X›, sondern ‹Y›»).
4. **STAKEHOLDER, ROLLENKLARHEIT & ARGUMENTARIUM:** Zielgruppen, saubere Rollentrennung externer Partner (z.B. Stadt, Kanton, Ämter – ohne künstliche Vereinnahmung) und faktenbelegte Hauptargumente.
5. **PRIORISIERTE MASSNAHMEN & MEILENSTEIN-LOGIK:** Konkreter Fahrplan (Was | Wann/Meilenstein | Kanal/Akteur).
6. **RISIKEN, DO'S/DON'TS & TOP-3 KRITISCHE FRAGEN:** Wichtigste Fallstricke sowie souveräne, isoliert zitierbare Kurzantworten auf die 3 heikelsten Fragen.`
        },
        'O-TABLE': {
            id: 'O-TABLE',
            title: 'Kurzrückmeldung & Detailtabelle (Beilage)',
            compile: () => {
                return `TASK: VERSANDFERTIGE KURZRÜCKMELDUNG & DETAILTABELLE ALS BEILAGE
Liefere das Ergebnis in exakt zwei direkt nutzbaren Teilen:

1. **VERSANDFERTIGE KURZRÜCKMELDUNG AN ABSENDER / AUTORENSCHAFT:**
   Formuliere eine kurze, direkt im E-Mail-Verlauf versandfertige Rückmeldung an die anfragende Person mit: (a) **Urteil zur strategischen Passung & Freigabe** (passt das Konzept zum Publikationssetting oder braucht es eine Neugewichtung?), (b) den **2–3 priorisierten Hauptanpassungsfeldern** im Gesamtbild (z.B. Einordnung der Organisationsrolle, Faktengrenzen).

2. **DETAILTABELLE ALS BEILAGE (NUR ENTSCHEIDUNGSRELEVANTE ABWEICHUNGEN):**
   Führe ausschliesslich Stellen auf, bei denen echter Handlungsbedarf besteht (stimmige Passagen und irrelevante Kleinigkeiten weglassen). Klassifiziere in Spalte 2 die **Eingriffstiefe** (*zwingende Anpassung* | *empfohlene Schärfung* | *entfernen/Reserve*) und lege dich bei Varianten auf **eine** Version fest:
   - **Kollegial-redaktioneller Stil (Spalte 3):** Keine Direktansprache («Sie/ihr»), nicht belehrend («muss ersetzt werden»). Begründe **nur die konkrete Abweichung zum Original** (1 Begründung pro Stelle/Folie im Muster: *«Die Formulierung wirkt … Das ‹…› blendet X aus / nimmt Y vorweg. Würde … klarer einordnen. Deshalb allenfalls besser so:»*).
   - **Fehlende Angaben (Spalte 4):** Als **«[Bearbeitungskommentar: Konkreten Umsetzungsstand / Kontext zu X ergänzen]»** markieren, niemals erfinden.

| Stelle & Originalformulierung | Eingriffstiefe & Prüfpunkt | Kollegiale Begründung der Abweichung | Konkreter Formulierungsvorschlag («Deshalb allenfalls besser so:») / Bearbeitungskommentar |
|---|---|---|---|`;
            }
        },
        'O-THEMENPLANUNG': {
            id: 'O-THEMENPLANUNG',
            title: 'Themen- & Redaktionsplanung',
            text: `TASK: RELEVANZ-EINSTUFUNG & THEMENPLANUNGS-EINTRAG
Stufe das Thema nach Relevanz ein (**Kategorie A:** hohe strategische/mediale Relevanz oder Krise; **Kategorie B:** mittlere/regionale/fachspezifische Relevanz; **Kategorie C:** geringe/rein operative Relevanz) und erstelle den fertigen Eintrag für das Themenboard:

TITEL: [Bereich / Projekt / Standort]: [Kompakter Beschrieb]
TERMIN: [Datum / Zeit]
TL;DR: [Management-tauglicher Entscheidungssatz zu Anlass, Kontext, Relevanz und Kernbeschluss]
STRATEGISCHE RELEVANZ: [2–3 Sätze zum Beitrag auf die Gesamtstrategie und Positionierung]
KOMMUNIKATIONSZIEL: [2–3 Sätze zur angestrebten Wirkung]
PLANUNGSSTAND: [1 Satz zu Stand, Datum, Medium/Akteur und nächstem Schritt]
ANSPRECHPERSON / FACHBEREICH: [Name, Bereich, Funktion]
THEMENBOARD-BESCHLUSS: [Kategorie A/B/C mit Kurzbegründung in Klammern + Bestätigung der Massnahme in 1 Satz]`
        },
        'O-MEETING': {
            id: 'O-MEETING',
            title: 'Meeting-Briefing',
            text: `TASK: KOMPAKTES MEETING-BRIEFING
Strukturiere das Briefing präzise für die direkte Gesprächsvorbereitung:
- **ZIEL, LINIE & NICHT-FESTLEGUNG (1–2 SÄTZE):** [Mein Kernziel im Termin + rote Linie, worauf ich mich nicht vorzeitig festlegen lasse]
- **MEINE ROLLE & ENTSCHEIDUNGSLOGIK:** [Welcher Entscheid/Beitrag ist gefragt und welcher sachliche Meilenstein gilt vor allfälligen Zusagen?]
- **AKTIV ZU PLATZIERENDE BOTSCHAFTEN (2–3 PUNKTE, OUTSIDE-IN):** [...]
- **HEIKLE PUNKTE & GEGENFRAGEN:** [Kritischer Punkt → Souveräne, sachlich begründete Reaktion ohne Vorfreigabe]
- **DO'S & DON'TS:** [Konkrete Gesprächs- und Wording-Leitplanken]`
        },
        'O-ACTIONS': {
            id: 'O-ACTIONS',
            title: 'Konkrete Handlungsempfehlungen',
            text: `TASK: PRIORISIERTE HANDLUNGSEMPFEHLUNGEN
Leite aus dem Entscheid konkrete, nach Dringlichkeit priorisierte Kommunikationsmassnahmen (inkl. Zielwirkung und Zuständigkeit) ab – oder begründe knapp, warum bewusst auf aktive Kommunikation verzichtet wird.`
        },
        'O-WEEKLY': {
            id: 'O-WEEKLY',
            title: 'Wochenstart-Bericht',
            text: `TASK: DELTA-ANALYSE & WOCHENSTART-BERICHT
Erstelle auf Basis des Microsoft-Graph-Scans direkt die versandfertige Briefing-Vorlage:

BETREFF: «Briefing: Status, Delta & Inbox-Triage [Aktuelles Datum]»

## RÜCKBLICK & WICHTIGSTE ENTWICKLUNGEN
[Kompakte Synthese der wichtigsten Vorgänge und Entscheidungen]

## DELTA-ANALYSE & ESKALATIONEN
[Planänderungen, näher rückende Fristen und kritische Verschiebungen gegenüber Vorstatus]

## INBOX- & PENDENZEN-TRIAGE
| Priorität | Absender / Akteur | Thema / Betreff | Empfohlene Aktion | Kurzbegründung |
|-----------|-------------------|-----------------|-------------------|----------------|`
        },
        'O-UPDATE': {
            id: 'O-UPDATE',
            title: 'Rückkehrer-Update',
            text: `TASK: DELTA-ANALYSE & STATUS-UPDATE
Erstelle ein prägnantes, sofort versandfertiges Status- und Rückkehrer-Briefing:

THEMA: {THEMA} | FÜR: {PERSON} | ZEITRAUM: {ZEITRAUM}
TL;DR (KERNENTSCHEID & STATUS): [Max. 3–4 Sätze]

- **WICHTIGSTE ENTWICKLUNGEN:** [Chronologische Kernaussagen aus M365 Graph]
- **DELTA ZUR AUSGANGSLAGE:** [Was hat sich verändert, verschoben oder zugespitzt?]
- **AKTUELLER STAND & HANDLUNGSBEDARF:** [Konkrete nächste Schritte und Entscheidungen für {PERSON}]`
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
            text: `TASK: PUBLIKATIONSSETTING, ROLLENPASSUNG & ARTIKEL-OUTLINE
1. **Publikationssetting & Rollen-Einordnung:** Kläre Format (z.B. Gastbeitrag, Paid Content, Jubiläums-/Unternehmenspublikation, Fachartikel), Zielpublikum sowie die korrekte Einordnung der übergeordneten Rolle und Gesamtleistung unserer Organisation.
2. **Aufhänger & Dramaturgie (Hook):** Bestimme den stärksten Einstieg (konkretes Beispiel, Beobachtung vor Ort, Zahl oder Spannungsfeld) und den roten Faden.
3. **Detaillierte Artikel-Gliederung:** Erstelle die Abschnitts-Outline mit sprechenden Zwischenüberschriften, Kernaussagen pro Absatz und vorgesehenen Fakten/Zitaten.`
        },
        'O-ARTICLE-DRAFT': {
            id: 'O-ARTICLE-DRAFT',
            title: 'Vollständiger Artikelentwurf',
            text: `TASK: VOLLSTÄNDIGER ARTIKELENTWURF
Verfasse direkt den vollständigen, publikationsreifen Artikel auf Basis der Outline und der gesicherten Recherche (offene Punkte als «[Offen: ...]» markieren).
Qualitätskriterien:
- **Glaubwürdigkeit vor PR-Sterilität:** Fesselnder Einstieg (Lead) und anschauliche, lebendige Sprache ohne Eigenlob-Floskeln oder KI-Phrasen.
- **Faktenstatus & Notwendige Konkretion:** Gesicherte Tatsachen strikt von Prüfoptionen/Planungsannahmen trennen; bei offener Ausgestaltung verständliche Oberbegriffe nutzen; keine unbelegten Versprechen.
- **Konsistente Einordnung:** Unsere Kernrolle und Leistung im Gesamtsystem organisch sichtbar machen, unterschiedliche Rollen externer Partner sauber wahren.`
        },
        'O-PPT-STORYBOARD': {
            id: 'O-PPT-STORYBOARD',
            title: 'Folien-Storyboard & Konkrete Folien-Inputs',
            text: `TASK: FOLIEN-FÜR-FOLIEN-ABGLEICH & KONKRETE TEXTVORSCHLÄGE
Setze die Leitlinie und die Prüfkriterien direkt auf Folienebene um (ohne Wiederholung der Voranalyse). *Effizienz-Regel für MODUS B:* Folien mit dem Urteil **«stimmig»** oder **«entfernen/Reserve»** in 1 Zeile abhandeln; arbeite den vollen Textvorschlag nur für Folien mit Änderungsbedarf aus:
---
### FOLIE [Nr.] (bzw. Q&A): [Originaltitel | Eingriffstiefe: stimmig / kleinere Anpassung / grössere Anpassung / entfernen bzw. Reserve]
- **ACTION TITLE / KERNAUSSAGE:** [Aktiver Aussagesatz; tragfähige Originaltitel nur so weit wie nötig schärfen]
- **FINALER TEXTVORSCHLAG (OUTSIDE-IN & LEAK-FEST):**
  * [Direkt übernehmbarer Wortlaut: **Ziel/Bedarf & Handlung zuerst**, Rahmenbedingungen sachlich danach. Bedarf, Vorzugsbewertung und offenen Entscheid strikt trennen; Rollen externer Partner wahren; keine unbelegten Zeit-/Optionsversprechen]
  * [Bei fehlendem Vollzugsstand/Nachweis explizit als «[Bearbeitungskommentar: Konkreten Umsetzungsstand/Nachweis zu X ergänzen]» markieren]
- **BEGRÜNDUNG DER ABWEICHUNG (KOLLEGIAL-REDAKTIONELL, 1 PRO FOLIE / Q&A):** [Direkt an die Autorenschaft weitergebbar, ohne Direktansprache/Belehrung, nur Abweichung zum Original begründen: «Die Originalformulierung ‹…› wirkt … Würde … Deshalb allenfalls besser so.»]
---

TASK: BACKUP-FOLIEN & DIE 3 HÄRTESTEN FRAGEN IM RAUM
1. **Empfohlene Backup-Folien (1–3 Folien):** Welche Detaildaten, Nachweise oder Spezialfragen gehören bewusst in den Anhang, um den Hauptteil schlank zu halten?
2. **Antizipation der 3 härtesten Fragen (Gremium, Politik, Medien):** Die 3 unangenehmsten Fragen zum Vorhaben – jeweils mit einer souveränen, faktenfesten 2-Satz-Antwort.`
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
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { scope: 'media' } }, 'T-TLDR']
                },
                {
                    title: 'STRATEGIE',
                    role: 'Du bist ein erfahrener Kommunikationsstratege.',
                    chunks: [{ chunkId: 'S-FULL', params: { includeFormatAnalysis: true } }]
                },
                {
                    title: 'OUTPUT (MEDIENANTWORT)',
                    role: 'Du bist ein erfahrener Mediensprecher.',
                    chunks: ['O-MEDIA']
                }
            ],
            forks: ['O-QA', 'O-INTERVIEW', 'O-THEMENPLANUNG', 'C-MEDIA-CHECK']
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
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { focus: 'bisherige Berichterstattung, bisherige Unternehmens- bzw. Organisations-Positionierungen, Journalistin/Journalist und Medium' } }, 'T-TLDR']
                },
                {
                    title: 'STRATEGIE',
                    role: 'Du bist ein erfahrener Kommunikationsstratege.',
                    chunks: [{ chunkId: 'S-FULL', params: { includeFormatAnalysis: true } }]
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
                    chunks: ['I-MAIL', { chunkId: 'R-FULL', params: { scope: 'media' } }, 'C-REQUEST', 'T-TLDR']
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
                    chunks: ['S-FULL']
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
                    chunks: ['O-REPLY']
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
                    chunks: ['O-MEETING']
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
                    chunks: [{ chunkId: 'S-DECISION', params: { mode: 'issue' } }, 'O-ACTIONS']
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
                    chunks: ['A-AUDIT-ALL', 'O-TABLE']
                }
            ],
            forks: ['O-REPLY', 'O-QA']
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
                    chunks: ['S-DECISION', 'A-AUDIT-ALL', { chunkId: 'O-TABLE', params: { withSummary: true } }]
                }
            ],
            forks: ['O-REPLY', 'O-QA']
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
                    chunks: ['O-THEMENPLANUNG']
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
                    title: 'LAGEBILD & KERNAUSSAGEN',
                    role: 'Du bist ein leitender Magazin-Redakteur und Co-Autor.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-THESIS', 'T-TLDR']
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
                    chunks: ['O-WEEKLY']
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
                    chunks: [
                        { chunkId: 'I-TIME', params: { withTopic: true } },
                        { chunkId: 'R-TIME', params: { withTopic: true } },
                        'T-TLDR'
                    ]
                },
                {
                    title: 'DELTA & BRIEFING',
                    role: 'Du bist ein präziser Intelligence Officer.',
                    chunks: ['O-UPDATE']
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
                    chunks: ['I-QUERY', { chunkId: 'R-FULL', params: { scope: 'media' } }, 'C-PERSPECTIVE', 'T-TLDR']
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
                        compile: () => `TASK: KOMPAKTE STAKEHOLDER- & PLANUNGSEINTRÄGE
Extrahiere alle relevanten Themen aus dem vorliegenden E-Mail-Verlauf, den Termin-/Besprechungsnotizen oder angehängten Unterlagen und erstelle kurze Einträge im Stil einer internen Kommunikationsplanung.
- **Zielstil:** Pro Thema genau ein kompakter Eintrag. Sachlich, knapp, planungstauglich.
- **Form:** «Standort/Bereich, Thema: Kerninhalt; Stakeholder-/Kommunikationshinweis; Datum.»`
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
                    title: 'LAGEBILD, ZIELGRUPPE & BELASTBARKEIT',
                    role: 'Du bist ein strategischer Executive-Präsentationsberater, Kommunikationsstratege und politisch-medialer Risikoprüfer.',
                    chunks: ['I-PPT', 'R-FULL', 'T-TLDR']
                },
                {
                    title: 'STRATEGIE, ARGUMENTATION & STORYLINE',
                    role: 'Du bist ein leitender Kommunikationsstratege und Storyline-Architekt für anspruchsvolle Entscheidungs- und Stakeholder-Gremien.',
                    chunks: ['S-PPT-STRATEGY']
                },
                {
                    title: 'FOLIEN-STORYBOARD & KONKRETE INPUTS',
                    role: 'Du bist ein erstklassiger Präsentations-Autor und Dramaturg für kontextstarke, politisch und medial belastbare Entscheidungsvorlagen.',
                    chunks: ['O-PPT-STORYBOARD']
                }
            ],
            forks: ['O-TABLE', 'O-QA', 'O-REPLY']
        },

        // 18. MEDIENANTWORT-CHECK (SINGLE SHOT - SCHEMA a-d)
        {
            id: 'recipe-medienantwort-check',
            name: 'Medienantwort-Check',
            family: 'review',
            turns: [
                {
                    title: 'QUALITÄTS- & FRAMING-CHECK (SCHEMA a–d)',
                    role: 'Du bist ein erfahrener Chef-Kommunikator, Mediensprecher und politisch-medialer Schlussredakteur.',
                    chunks: ['C-MEDIA-CHECK']
                }
            ],
            forks: ['O-QA', 'O-MEDIA']
        }
    ];

    /**
     * Compiles a specific turn of a recipe into raw prompt text.
     */
    function compileTurn(recipe, turnIndex, options) {
        options = options || {};
        const rawVars = options.variableValues || {};
        const userSteeringNote = options.userSteeringNote || '';
        const previousTurnTitle = options.previousTurnTitle || '';
        const isExpress = !!options.isExpress;

        const turn = recipe.turns[turnIndex];
        if (!turn) return null;

        // Build effective variable map with fallbacks to recipe defaults or active Outlook context
        const effectiveVars = {};
        if (Array.isArray(recipe.variables)) {
            for (const v of recipe.variables) {
                const k = v.key || v.name;
                if (k) {
                    const provided = rawVars[k] !== undefined && rawVars[k] !== '' ? rawVars[k] : v.default;
                    effectiveVars[k] = provided || 'Gemäss aktuellem E-Mail-Verlauf / Kontext';
                }
            }
        }
        for (const [vKey, vVal] of Object.entries(rawVars)) {
            if (vVal !== undefined && vVal !== '') {
                effectiveVars[vKey] = vVal;
            } else if (!effectiveVars[vKey]) {
                effectiveVars[vKey] = 'Gemäss aktuellem E-Mail-Verlauf / Kontext';
            }
        }

        const parts = [];

        // 1. Header & Role
        if (isExpress) {
            parts.push(`SCHRITT ${turnIndex + 1}: ${turn.title}`);
        } else {
            parts.push(`${recipe.name.toUpperCase()}: ${turn.title}`);
        }

        // Output role: in express mode, emit only once at turn 0 to prevent mid-prompt persona switching
        if (turn.role && (!isExpress || turnIndex === 0)) {
            parts.push(`ROLLE:\n${turn.role}`);
        }

        // 2. Constraints & Handoffs
        if (turnIndex === 0) {
            parts.push(G_RAHMEN);
        } else if (!isExpress) {
            // Multi-turn handoff contract
            const resolvedPrevTitle = previousTurnTitle || (recipe.turns[turnIndex - 1] && recipe.turns[turnIndex - 1].title) || 'LAGEBILD';
            let handoff = `BASIS:\nVorangegangene Erkenntnisse und Festlegungen aus dem Schritt «${resolvedPrevTitle}» in diesem Chat.`;
            if (userSteeringNote && userSteeringNote.trim()) {
                handoff += `\n\nSTEUERUNG DURCH NUTZER:\n${userSteeringNote.trim()}`;
            }
            parts.push(handoff);
            parts.push(G_OUTPUT_STYLE);
        } else if (userSteeringNote && userSteeringNote.trim()) {
            parts.push(`STEUERUNG DURCH NUTZER:\n${userSteeringNote.trim()}`);
        }

        // 3. Assemble Chunks or Direct Turn Content
        let rawContent = '';
        if (Array.isArray(turn.chunks) && turn.chunks.length > 0) {
            const chunkTexts = [];
            for (const item of turn.chunks) {
                let chunkId = typeof item === 'string' ? item : item.chunkId;
                // In Express Mode, skip intermediate T-TLDR summaries on non-final turns of multi-turn recipes
                if (isExpress && chunkId === 'T-TLDR' && recipe.turns.length > 1 && turnIndex < recipe.turns.length - 1) {
                    continue;
                }
                let params = typeof item === 'object' ? item.params : {};
                let chunkDef = CHUNKS[chunkId] || item;

                if (!chunkDef) continue;

                let chunkText = '';
                if (typeof chunkDef.compile === 'function') {
                    chunkText = chunkDef.compile(params);
                } else {
                    chunkText = chunkDef.text || chunkDef.content || '';
                }

                // Interpolate variables (e.g. {ZEITRAUM}, {PERSON}, {SUCHBEGRIFF}, {THEMA})
                for (const [vKey, vVal] of Object.entries(effectiveVars)) {
                    chunkText = chunkText.replaceAll(`{${vKey}}`, vVal);
                }

                chunkTexts.push(chunkText);
            }
            rawContent = chunkTexts.join('\n\n');
        } else if (turn.content || turn.text) {
            let turnText = turn.content || turn.text || '';
            for (const [vKey, vVal] of Object.entries(effectiveVars)) {
                turnText = turnText.replaceAll(`{${vKey}}`, vVal);
            }
            rawContent = turnText;
        }

        // Auto-number TASK headers sequentially within this turn
        let taskCounter = 0;
        const normalizedContent = rawContent.replace(/^TASK(?:\s+\d+)?:/gm, () => {
            taskCounter += 1;
            return `TASK ${taskCounter}:`;
        });

        if (normalizedContent) {
            parts.push(normalizedContent);
        }

        if (!isExpress && turnIndex < recipe.turns.length - 1) {
            parts.push(`PHASEN-FOKUS:\nFühre in diesem Schritt ausschliesslich «${turn.title}» aus. Erstelle noch keinen finalen Antwort-, Text- oder Folienentwurf.`);
        }

        return parts.join('\n\n');
    }

    /**
     * Compiles the entire recipe into a single message (EXPRESS MODE).
     */
    function compileExpress(recipe, variableValues) {
        variableValues = variableValues || {};
        const isMultiStep = Array.isArray(recipe.turns) && recipe.turns.length > 1;
        const execInstruction = isMultiStep
            ? 'Führe diesen mehrstufigen Workflow komplett in einer einzigen Antwort aus (80/20-Fokus): Behandle die Vorstufen (Analyse & Strategie) als ultra-kompaktes Prüf-Gate (max. 5–8 Stichpunkte insgesamt; direkter Entscheid für die beste Option statt langer Variantenvergleiche; keine doppelten Folien-/Textdurchläufe vorab). Wiederhole Herleitungen aus den Vorstufen im letzten Schritt nicht erneut (Redundanz-Sperre), sondern lege 80 % des Gewichts auf das direkt versandfertige Endresultat.'
            : 'Führe diesen Auftrag direkt und präzise aus.';
        const header = `${recipe.name.toUpperCase()} (EXPRESS-MODUS)\n${execInstruction}`;
        const turnTexts = recipe.turns.map((_, i) => compileTurn(recipe, i, { variableValues, isExpress: true }));
        const joined = [header, ...turnTexts].join('\n\n---\n\n');
        let expressTaskCounter = 0;
        return joined.replace(/^TASK(?:\s+\d+)?:/gm, () => {
            expressTaskCounter += 1;
            return `TASK ${expressTaskCounter}:`;
        });
    }

    /**
     * Compiles an alternative branch / fork output prompt.
     */
    function compileFork(recipe, outputChunkId, options) {
        options = options || {};
        const variableValues = options.variableValues || {};
        const userSteeringNote = options.userSteeringNote || '';
        const chunkDef = CHUNKS[outputChunkId];
        if (!chunkDef) return null;

        const parts = [];
        parts.push(`FORK-OUTPUT: ${chunkDef.title.toUpperCase()}`);

        const recipeName = recipe ? recipe.name : 'PromptDock';
        let handoff = `BASIS:\nVorangegangene Recherche, Analyse und Strategiefestlegungen im aktuellen Chatverlauf (Workflow «${recipeName}»).`;
        if (userSteeringNote && userSteeringNote.trim()) {
            handoff += `\n\nSTEUERUNG DURCH NUTZER:\n${userSteeringNote.trim()}`;
        }
        parts.push(handoff);
        parts.push(G_OUTPUT_STYLE);

        let chunkText = typeof chunkDef.compile === 'function' ? chunkDef.compile(options.params || {}) : (chunkDef.text || '');
        for (const [vKey, vVal] of Object.entries(variableValues)) {
            chunkText = chunkText.replaceAll(`{${vKey}}`, vVal || `[${vKey}]`);
        }

        let taskCounter = 0;
        const normalizedChunkText = chunkText.replace(/^TASK(?:\s+\d+)?:/gm, () => {
            taskCounter += 1;
            return `TASK ${taskCounter}:`;
        });
        parts.push(normalizedChunkText);

        return parts.join('\n\n');
    }

    return {
        CHUNKS,
        RECIPES,
        G_RAHMEN,
        G_OUTPUT_STYLE,
        compileTurn,
        compileExpress,
        compileFork
    };
}));
