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
- **Eigentlicher Auftrag & Adressatenkreis:** Worin besteht das eigentliche Ziel (**interne Einschätzung/Linie** «Was meinst du?», **Direktantwort**, **verwendbarer Textblock/Wording für Dritte** wie Betroffene/Partner/Behörden oder **Beitrag/Planung**) und für wen ist das Resultat bestimmt?
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
                return `TASK: RECHERCHE & FAKTENABGLEICH (M365 GRAPH & #KOM-ANKER)
Durchsuche E-Mails, Teams-Chats (priorisiere dabei mit «#KOM-ANKER» markierte Notizen, Links und Screenshots im Self-Chat), Besprechungsnotizen und SharePoint gezielt nach: ${focus}.
- Gleiche Vorannahmen der Anfrage aktiv gegen unabhängige M365-Quellen und «#KOM-ANKER»-Referenzen ab, statt sie ungeprüft zu übernehmen.
- **Faktenstatus & Konsistenz:** Ordne jede zentrale Aussage eindeutig einer Stufe zu (*fachlich geprüft und beschlossen* | *geplant oder vorgesehen* | *in Prüfung* | *offen [Zu prüfen]* inkl. Quelle). Vermische diese Grade nicht und decke Termin-Widersprüche auf.`;
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
            title: 'Haltung, Narrativ & Schutzgrenzen',
            text: `TASK: EMPFOHLENE HALTUNG & SCHUTZGRENZEN
Formuliere in 1–2 prägnanten Sätzen unsere empfohlene Haltung, das **eigene sachliche Narrativ** und die **Schutzgrenzen** (worauf wir uns bewusst nicht vorab festlegen: z.B. offener Lösungsraum, laufende Verfahren/Entscheide Dritter, Vertraulichkeit).`
        },
        'S-MESSAGES': {
            id: 'S-MESSAGES',
            title: 'Sprachregelung (Basistext) & Kernbotschaften',
            compile: (params) => {
                const count = params?.count || 'drei';
                return `TASK: DIREKT VERWENDBARE SPRACHREGELUNG & KERNBOTSCHAFTEN
1. **Kompakter Basistext (1 Absatz):** Formuliere einen direkt verwendbaren, menschlich und unbürokratisch geschriebenen Sprachregelungs-Block aus eigener Perspektive (*Was gilt / Was tun wir → Warum ist das sinnvoll → Wie geht es weiter*, inkl. sauberem Planungs-Vorbehalt bei offenen Punkten).
2. **Kernbotschaften (${count} Punkte, Outside-in):** Verdichte die Linie auf ${count} prägnante, isoliert zitierfähige Kernbotschaften ohne Fach-Jargon oder unbelegte Versprechen.`;
            }
        },
        'S-DECISION': {
            id: 'S-DECISION',
            title: 'Strategische Vorprüfung & Entscheid',
            compile: (params) => {
                const isIssue = params?.mode === 'issue';
                const focusLine = isIssue
                    ? 'Prüfe anhand von *Aufwand vs. Ertrag*, *Gleichbehandlung/Präzedenzwirkung*, *Deutungs-/Expositionsrisiko* und *Verfahrenslead*, ob kommunikativer Handlungsbedarf besteht (*aktive Positionierung* vs. *reaktive Bereitschaft / Q&A* vs. *bewusster Verzicht*):'
                    : 'Beurteile zuerst auf Gesamtebene, ob das vorliegende Konzept zum Publikationssetting und zur Rolle unserer Organisation passt (*Konzept stimmig / punktuelle Schärfung* vs. *inhaltliche Neugewichtung* vs. *grundlegende Überarbeitung / Nichtfreigabe*):';
                return `TASK: STRATEGISCHE VORPRÜFUNG & ENTSCHEID\n${focusLine}\nWäge kurz die 2–3 ausschlaggebenden Gründe ab, lege dich verbindlich fest und formuliere den Kernentscheid in genau einem prägnanten Satz.`;
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
Prüfe zuerst, ob eine neue Strategie nötig ist oder ob eine erkennbare Linie vorliegt, die konsequent auf die Folien abgeglichen werden muss (kürzester belastbarer Weg ohne redundante Zwischenprodukte):
- **Strategische Leitlinie (1 Satz):** Formuliere den tragenden Leitsatz, der den zentralen Zielkonflikt löst, ohne offene spätere Entscheide vorwegzunehmen.
- **Dramaturgie-Entscheid:** Wähle bei *MODUS A (Neukonzeption)* die stärkste Dramaturgie (BLUF, SCQA oder Einordnungs-Dramaturgie); entscheide bei *MODUS B (bestehendes Deck)* zwischen *fokussiertem Strategieabgleich am bestehenden Deck* und *strukturellem Redesign*.

TASK: VERDICHTETE PRÜFKRITERIEN (MAX. 5 SPRACH- & INHALTSREGELN)
Übersetze die Leitlinie in höchstens 5 verbindliche Prüfkriterien:
1. **Stufen-Trennung:** Gesicherten Stand, bisherige Präferenz und offene Prüf-/Realisierungsentscheide sauber trennen; offene Optionen nicht als feststehende Versprechen führen.
2. **Rollen- & Mandatsklarheit:** Unterschiedliche Rollen und Zuständigkeiten externer Partner (z.B. Bund, Kanton, Stadt, Ämter) präzise wahren, statt sie künstlich zu vereinnahmen.

TASK: FOLIEN-TRIAGE & HORIZONTALE STORYLINE
- **Bei MODUS A:** Entwirf die fortlaufende Liste aller **Action Titles (ganze, aktive Aussagesätze pro Folie)** als lückenlose Storyline.
- **Bei MODUS B:** Klassifiziere jede Folie verbindlich nach Eingriffstiefe (**stimmig** | **kleinere Anpassung** | **grössere Anpassung** | **entfernen/Reserve**). Bereinige Dubletten und Varianten – lege dich jeweils verbindlich auf **eine** überzeugende Fassung fest.`
        },
        'A-AUDIT-ALL': {
            id: 'A-AUDIT-ALL',
            title: '3D-Audit (Setting-Kalibrierung, Faktengrenzen, Outside-in)',
            text: `TASK: SETTING-GERECHTES DREI-DIMENSIONEN-AUDIT (OHNE SCHEIN-BEANSTANDUNGEN)
Gewichte alle Beanstandungen pragmatisch nach dem konkreten Publikationsauftrag (tragfähige Passagen unverändert belassen, nur echte Verbesserungen vorschlagen):
1. **FAKTENGRENZEN, EVIDENZ & ENTSCHEIDUNGSSTAND:**
   - **Keine Schein-Beanstandungen:** Beanstande Zahlen oder Fakten nur dann, wenn eine Quelle ihnen nachweislich widerspricht – erzeuge keine spekulativen Pedanterie-Einwände.
   - **Entscheidungsstufen:** Trenne *gesicherten Stand*, *Planung/Präferenz* und *offene Prüfung* sauber (offene Prüfoptionen nicht als Versprechen formulieren; fehlenden Vollzugsstand bei Bedarf als Bearbeitungskommentar markieren).
2. **ROLLENKLARHEIT & KONSISTENZ:**
   - Stelle Zuständigkeit und Verfahrenslead (unsere Rolle im Gesamtsystem vs. Auftrag/Entscheid Dritter) klar dar, entschärfe unnötige Zuspitzungen und bereinige offene Varianten durch Festlegung auf **eine** stimmige Fassung.
3. **SETTING-ANGEMESSENHEIT, OUTSIDE-IN & LESBARKEIT:**
   - **Glaubwürdigkeit vor PR-Sterilität:** Bewahre eine natürliche, lebendige Sprache. Bei Paid Content, Jubiläums-, Gast- oder Magazinbeiträgen ist journalistischer Stil und sachliche Distanz ausdrücklich erwünscht – glätte gute Texte nicht zu steriler Konzernsprache, sondern greife nur dort ein, wo Kontext fehlt oder Rollen verzerrt werden.

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
   - Definiere vorab knapp: Welches **eigene, überzeugende Narrativ** soll hängen bleiben, welche Haltung vermittelt die Antwort, und **was lassen wir aus den internen Inputs bewusst weg** (Schutz von Lösungsraum, Vertraulichkeit, fremder Zuständigkeit)?

2. **MEDIENANTWORT (VERSANDFERTIGER ENTWURF):**
   - **Menschlich, konkret am Anlass & eigenes Narrativ:** Schreib natürlich, flüssig und nahbar wie ein erfahrener Mediensprecher – frei von steifer Behörden-, Juristen- oder FAQ-Sprache. Greife den konkreten Anlass, Ort oder die Beobachtung der Anfrage direkt auf. Wiederhole oder verneine niemals Vorwürfe oder Negativ-Frames, und vermeide belehrende Banalitäten über Selbstverständlichkeiten.
   - **Souveräne Substanz statt steriler Vorsicht:** Wo wir auf Einzelabklärungen (Zahlen, Einzelfalldaten, Termine) bewusst verzichten oder Details offen sind, weiche nicht in hohle Abstraktion oder defensive Ausreden aus, sondern sättige das journalistische Bedürfnis durch greifbare Alltags- und Ablauferklärung aus der Praxis. Schütze nur tatsächlich offene künftige Entscheide (*beschlossen* | *geplant* | *in Prüfung*) vor vorzeitiger Festlegung (Einzel-Blocker bei Bedarf als «[Kurze Bestätigung durch Fachbereich X: ...]» markieren).

3. **ABSCHLIESSENDER REALITÄTS- & BELASTBARKEITS-CHECK (SCHEMA a–d):**
   Prüfe den Entwurf kritisch (je 1 kurzer Prüfsatz; bei Schwächen den Entwurf oben direkt korrigieren):
   - **a) Medial & politisch belastbar:** Fakten- und zuständigkeitssicher ohne vorzeitige Selbstbindung bei offenen Entscheiden?
   - **b) Nahbar, individuell & frei von Banalitäten:** Wirkt der Text auf eine Redaktion menschlich und spezifisch statt wie eine sterile Textbaustein-Abfertigung?
   - **c) Keine Reproduktion negativer Frames:** Frei von wiederholten oder defensiv verneinten Vorwürfen der Anfrage?
   - **d) Eigenes Narrativ & journalistische Sättigung:** Liefert die Antwort genug zitierfähige Substanz, damit kein Nachhak-Anruf nötig wird?`
        },
        'C-MEDIA-CHECK': {
            id: 'C-MEDIA-CHECK',
            title: 'Medienantwort-Check (Redaktions-Challenge & 2 Varianten)',
            text: `TASK: SACHVERHALTS- & RISIKO-ANALYSE
Analysiere den Sachverhalt nüchtern:
1. **Journalistische Ausgangslage & Motiv:** Welches Format und Ziel verfolgt die Redaktion mit der Anfrage und welche Substanz braucht sie für ihren Beitrag?
2. **Aufwand-Ertrags-Verhältnis (Triage):** Ist der Verzicht auf weitere interne Detailabklärungen verhältnismässig – oder wo liegt eine zwingende Fakten-/Zuständigkeitsgrenze?
3. **Kommunikatives Risiko:** Liegt das eigentliche Risiko im Sachthema (Reputation, offener Entscheidungsraum, fremde Zuständigkeit, Vertraulichkeit) oder in der **Tonalität und Wirkung** der Antwort (z.B. lieblose Textbaustein-Abfertigung, unfreiwillige Banalitäten oder Provokation unnötiger Nachhak-Anrufe)?

TASK: CHALLENGE DES ANTWORTENTWURFS
Challenge den vorliegenden Antwortentwurf kritisch und ungeschminkt aus Sicht einer wachen Redaktion und eines erfahrenen Mediensprechers:
- Wo verwechselt der Entwurf Vorsicht mit Sterilität, ignoriert den konkreten Anlass/Ort der Anfrage oder erklärt belehrend Selbstverständlichkeiten (Banalitäts-Falle)?
- Wo lässt er explizite Fragen unnötig offen (Rückfrage-Gefahr), obwohl sie sich über nachvollziehbare Praxis-/Ablauferklärung risikofrei beantworten liessen?
- Wo legt er uns umgekehrt ungesichert fest, verletzt Zuständigkeits-/Vertraulichkeitsgrenzen oder reproduziert fremdes Negativ-Framing?

TASK: SORGFÄLTIGE ABWÄGUNG & OPTIMIERTE TEXTVARIANTEN
1. **Sorgfältige Abwägung:** Wäge die wichtigsten Stellschrauben ab, wie die Antwort das journalistische Bedürfnis substanziell sättigt und sympathisch den Ball aufnimmt, ohne zusätzlichen internen Abklärungsaufwand oder Faktenrisiken auszulösen.
2. **Optimierte Textvarianten:** Formuliere zwei versandfertige Optionen:
   - **Variante 1 – Sympathisch & substanziell (Empfehlung):** Greift den konkreten Anlass natürlich auf, beantwortet offene Warum-/Wann-Fragen souverän über die reale Praxis-/Ablauferklärung, streicht Banalitäten und wahrt alle strategischen Schutzgrenzen.
   - **Variante 2 – Nahe am ursprünglichen Entwurf, aber entschärft (Minimal-invasiv):** Behält Struktur und Kürze des Entwurfs weitgehend bei, verankert ihn aber im Anlass und bereinigt Banalitäten, sterile Floskeln oder ungesicherte Festlegungen.`
        },
        'O-REPLY': {
            id: 'O-REPLY',
            title: 'Antwortentwurf (E-Mail / Textblock für Dritte)',
            text: `TASK: EMPFOHLENE LINIE & VERSANDFERTIGER E-MAIL-ENTWURF
Liefere das Ergebnis passend zum Auftrag (interne Einschätzung, Direktantwort oder verwendbarer Textblock für Dritte):

1. **Interne Einordnung & Empfehlung (Ich-Form, 1–3 Sätze):**
   - Gib eine klare, pragmatische Einschätzung («Aus meiner Sicht…») mit den ausschlaggebenden Gründen (z.B. Verhältnismässigkeit, Präzedenzwirkung, Zuständigkeit/Verfahrenslead oder warum bestimmte Rohdaten bewusst weggelassen werden) und dem empfohlenen nächsten Schritt.

2. **Versandfertiger Textblock / E-Mail-Entwurf:**
   - **Natürlicher, adressatengerechter Ton:** Schreib menschlich, klar und auf Augenhöhe – übersetze internen Fach-Jargon oder sperriges Rohmaterial in verständliche Sprache.
   - **Sache, Empathie & Spielraum:** Zeige bei Betroffenen Verständnis für das Anliegen (ohne voreiliges Schuldeingeständnis), erkläre den sachlichen Hintergrund nachvollziehbar und wahre bei offenen Terminen, Prüfungen oder Entscheiden Dritter den nötigen Spielraum durch natürliche Vorbehalte.`
        },
        'O-QA': {
            id: 'O-QA',
            title: 'Q+A Tabelle',
            text: `TASK: KRITISCHES Q+A (PROPORTIONAL, OUTSIDE-IN & ZITIERFÄHIG)
Erstelle ein kompaktes Q+A mit den 4–8 wichtigsten kritischen Fragen (Journalisten, Betroffene, Behörden/Partner – Anzahl proportional zum Thema). *Qualitätsregeln für jede Antwort:* (a) **Menschlich, konkret & eigenes Narrativ (Outside-in):** Natürliche, greifbare Sprache ohne internen Jargon oder hohle Floskeln; eigenes Handlungsnarrativ zuerst, niemals Vorwürfe wiederholen; (b) **Souveräne Abgrenzung & Vorbehalt:** Fremden Verfahrenslead/Auftrag klar benennen und offene künftige Entscheide durch nachvollziehbare Prozesslogik und natürliche Planungs-Vorbehalte schützen; (c) **Isoliert zitierbar**:
| Kritische Frage | Empfohlene Antwort (menschlich, eigenes Narrativ & isoliert zitierbar) | Begründung der Linie / Schutzgrenze |
|-----------------|------------------------------------------------------------------------|-------------------------------------|`
        },
        'O-INTERVIEW': {
            id: 'O-INTERVIEW',
            title: 'Interview- & Medienbriefing',
            text: `TASK: INTERVIEW- UND MEDIENBRIEFING
Erstelle das kompakte, sofort einsatzbereite Interview-Briefing in exakt folgender Struktur:
1. **Ziel, Rahmen & Rolle:** Ziel des Gesprächs, unsere Rolle (inkl. Abgrenzung bei fremdem Verfahrenslead/Auftrag) und Tonalität (2–3 Sätze).
2. **Eigenes Narrativ & Schutzgrenzen:** [Tragender Leitsatz aus eigener Perspektive + klare Grenze zu offenen Verfahren, Vertraulichkeit und Vorbehalten]
3. **Drei bis vier zitierfähige Kernbotschaften (Outside-in):** [Knapp, menschlich-nahbar, anschaulich und frei von internem Jargon]
4. **Fragenkatalog mit Antwortempfehlungen:** (Natürliche gesprochene Sprache mit greifbaren Beispielen/Praxislogik; eigenes Narrativ statt Wiederholung/Verneinung von Vorwürfen; saubere Vorbehalte bei offenen Entscheiden)
| Kritische Frage | Taktischer Fokus (was setzen / was weglassen) | Souveräner Antwortvorschlag (mündlich & zitierfähig) |`
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
   Formuliere eine kurze, direkt im E-Mail-Verlauf versandfertige Rückmeldung an die anfragende Person mit: (a) **Urteil zur strategischen Passung & Freigabe** (passt das Konzept zum Publikationssetting oder braucht es eine Neugewichtung?), (b) den **2–3 priorisierten Hauptanpassungsfeldern** im Gesamtbild.

2. **DETAILTABELLE ALS BEILAGE (NUR ENTSCHEIDUNGSRELEVANTE ABWEICHUNGEN):**
   Führe ausschliesslich Stellen auf, bei denen echter Handlungsbedarf besteht (stimmige Passagen und irrelevante Kleinigkeiten weglassen). Klassifiziere in Spalte 2 die **Eingriffstiefe** (*zwingende Anpassung* | *empfohlene Schärfung* | *entfernen/Reserve*) und lege dich bei Varianten auf **eine** Version fest:
   - **Kollegial-redaktionelle Begründung (Spalte 3):** Begründe natürlich, knapp und ohne belehrende Direktansprache («Sie/ihr»), warum die vorgeschlagene Fassung klarer, präziser oder besser abgesichert ist.
   - **Fehlende Angaben (Spalte 4):** Als **«[Bearbeitungskommentar: Konkreten Umsetzungsstand / Kontext zu X ergänzen]»** markieren, niemals erfinden.

| Stelle & Originalformulierung | Eingriffstiefe & Prüfpunkt | Kollegiale Begründung | Konkreter Formulierungsvorschlag / Bearbeitungskommentar |
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
- **ZIEL, LINIE & NICHT-FESTLEGUNG (1–2 SÄTZE):** [Kernziel im Termin + rote Linie, worauf wir uns vorab nicht festlegen]
- **ROLLE, VERFAHRENSLEAD & ENTSCHEIDUNGSLOGIK:** [Unser Mandat vs. Lead Dritter + sachlicher Meilenstein vor allfälligen Zusagen]
- **AKTIV ZU PLATZIERENDE BOTSCHAFTEN (2–3 PUNKTE, OUTSIDE-IN):** [...]
- **HEIKLE PUNKTE & REAKTION:** [Kritischer Punkt → Sachlich begründete Reaktion; bei Konflikten zuerst klärendes Gespräch vor schriftlicher Eskalation]
- **PENDENZEN & NÄCHSTE SCHRITTE:** [Konkrete Zuordnung: Was | Wer (namentlich) | Bis wann]`
        },
        'O-ACTIONS': {
            id: 'O-ACTIONS',
            title: 'Konkrete Handlungsempfehlungen',
            text: `TASK: PRIORISIERTE MASSNAHMEN & NÄCHSTE SCHRITTE
Leite aus dem Entscheid konkrete, priorisierte Schritte mit klarer Zuordnung (**Was | Wer | Bis wann**) ab – bei kurzfristigen Irritationen oder Konflikten nach dem Ablauf «zuerst klärendes Gespräch/Telefonat, dann schriftlich» (bzw. skizziere bei Verzicht auf aktive Kommunikation kurz die reaktive Sprachregelung auf Anfrage).`
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
- **Glaubwürdigkeit & Lesewert vor PR-Sterilität:** Fesselnder Einstieg (Lead), konkrete Beispiele und anschauliche, lebendige Sprache ohne Eigenlob-Floskeln oder KI-Phrasen.
- **Sauberer Faktenstatus:** Gesicherte Tatsachen klar von offenen Prüfoptionen/Planungsannahmen trennen; keine unbelegten Versprechen.
- **Konsistente Einordnung:** Unsere Kernrolle und Leistung im Gesamtsystem organisch sichtbar machen und die Rollen externer Partner fair wahren.`
        },
        'O-POST': {
            id: 'O-POST',
            title: 'Social Media Post (Challenge / Entwurf & Visual-Briefing)',
            compile: () => {
                return `ZIELKANAL / ABSENDER: {KANAL_PERSON}

TASK: KURZ-FEEDBACK (BEI ENTWURFS-CHALLENGE) & POSITIONIERUNGS-LINIE
1. **Einordnung an Anfragende (Ich-Form, 2–3 Sätze):**
   - *Falls im Thread bereits ein Post-Entwurf vorliegt:* Benenne kollegial («Aus meiner Sicht…»), was am Entwurf trägt und welche 2–3 Punkte wir schärfen sollten (z.B. Einstieg konkreter statt «Ich freue mich»-Floskel, internen Projekt-Jargon in Publikumsnutzen übersetzen, Rolle der integrierten Bahn oder Partner-Lead von Stadt/Kanton/Architektur sauberer einordnen, offene Planungsstände nicht als beschlossen darstellen).
   - *Falls ein neuer Post entsteht:* Begründe kurz den gewählten Aufhänger (Hook), das eigene Narrativ und was aus dem Rohmaterial bewusst weggelassen wird (Vertraulichkeit, ungesicherte Zahlen/Termine).
2. **Stimm- & Kanal-Kalibrierung:** Passe Perspektive und Tonfall exakt an die Zielperson bzw. den Kanal an:
   - *Geschäftsleitung / Executive Board (Thought Leadership):* Integrierte Gesamtsicht – Infrastruktur als Mobilitätsdrehscheibe und Visitenkarte, Einklang von Kernbetrieb und nachhaltiger Arealentwicklung, bezahlbarer Raum, Kreislaufwirtschaft/Klima, frühzeitige Partnerallianzen, Wertschätzung für Teams vor Ort.
   - *Projektentwicklung & Baukultur (Development):* Qualitätsvolle Arealentwicklung mit hoher Baukultur (Studienaufträge, Wettbewerbe, Partizipation), Innovation konkret erlebbar machen, Dreiklang aus Ökologie, Wirtschaft und Gesellschaft im engen Schulterschluss mit Städten und Gemeinden.
   - *Bewirtschaftung & Betrieb (Property & Asset Management):* Standorte als lebendige Treffpunkte und Begegnungsorte statt reiner Durchgangszonen, Aufenthaltsqualität, Lokalkolorit & Regionalität im Mieter-Mix, intelligente Mehrfachnutzung gegen Leerstände, Alltagskomfort für Nutzende und Reisende.
   - *Unternehmenskanal / Social Media (Instagram / LinkedIn):* Visuell-nahbares Storytelling auf Augenhöhe der Community – konkretes Detail vor Ort oder Blick hinter die Kulissen, direkter Alltagsnutzen, knappe Caption mit echter Community-Frage.

TASK: PUBLIKATIONSREIFE POST-VARIANTEN & VISUAL-BRIEFING
Erstelle zwei direkt verwendbare Textfassungen sowie den Bild-/Asset-Hinweis:

### 1. HAUPTENTWURF (SUBSTANZ & STORYTELLING)
- **Starker Hook (Zeile 1–2):** Konkrete Beobachtung vor Ort, spannende Frage oder greifbarer Wandel – strikt ohne hohle LinkedIn-Floskeln («Ich freue mich sehr…», «Ein weiterer Meilenstein…», Raketen-Emojis).
- **Körper (Outside-in & menschlich):** Konkreter Mehrwert für Nutzende, Quartier oder Umwelt zuerst; unsere Organisation und Einheiten organisch als Teil des Gesamtsystems zeigen; Faktenstatus und Planungs-Vorbehalte («nach heutigem Stand») sauber wahren; Partner (@Stadt, @Planer, Teams) fair würdigen.
- **Abschluss & Hashtags:** Glaubwürdiger Schlusssatz oder echte Diskussionsfrage + max. 3–5 präzise Hashtags.

### 2. ALTERNATIVE (POINTIERTE KURZFASSUNG)
- Kompakter, schnell scannbarer Post mit alternativem Einstieg (ideal für Mobile-Feeds oder Carousel-/Reel-Begleittext).

### 3. BILD- & ASSET-EMPFEHLUNG
- Welches konkrete Bild-/Videomotiv (z.B. echte Szene mit Menschen/Baufortschritt vor Ort, Vorher/Nachher-Carousel, kurzes Statement-Reel statt steriler Visualisierung) die Aussage am besten trägt.`;
            }
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
  * [Direkt übernehmbarer Wortlaut: **Ziel/Bedarf & Handlung zuerst**, Rahmenbedingungen sachlich danach. Gesicherten Stand, Präferenz und offenen Entscheid sauber trennen; Rollen externer Partner wahren]
  * [Bei fehlendem Vollzugsstand/Nachweis explizit als «[Bearbeitungskommentar: Konkreten Umsetzungsstand/Nachweis zu X ergänzen]» markieren]
- **BEGRÜNDUNG DER ABWEICHUNG (KOLLEGIAL-REDAKTIONELL):** [Knappe, natürliche Begründung ohne belehrende Direktansprache, warum die Anpassung das Anliegen klarer oder belastbarer auf den Punkt bringt]
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
            forks: ['O-STRATEGY', 'O-ACTIONS', 'O-QA']
        },

        // 5. EMAIL BEANTWORTEN (2 TURNS)
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

        // 8. TEXTPRÜFUNG & FREIGABE (2 TURNS)
        {
            id: 'recipe-freigabe',
            name: 'Textprüfung & Freigabe',
            family: 'review',
            turns: [
                {
                    title: 'LAGEBILD',
                    role: 'Du bist ein Chefredakteur, Fact-Checker und Freigabeverantwortlicher.',
                    chunks: ['I-DOC', 'R-FULL', 'T-TLDR']
                },
                {
                    title: 'DREI-DIMENSIONEN-AUDIT & FREIGABE',
                    role: 'Du bist ein Chefredakteur, Fact-Checker und Freigabeverantwortlicher.',
                    chunks: ['A-AUDIT-ALL', 'O-TABLE']
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

        // 18. MEDIENANTWORT-CHECK (SINGLE SHOT - REDAKTIONS-CHALLENGE & 2 VARIANTEN)
        {
            id: 'recipe-medienantwort-check',
            name: 'Medienantwort-Check',
            family: 'review',
            turns: [
                {
                    title: 'REDAKTIONS-CHALLENGE & OPTIMIERUNG',
                    role: 'Du bist ein erfahrener Chef-Kommunikator, Mediensprecher und kritischer Redaktions-Sparringpartner.',
                    chunks: ['C-MEDIA-CHECK']
                }
            ],
            forks: ['O-QA', 'O-MEDIA']
        },

        // 19. SOCIAL MEDIA POST (LINKEDIN / INSTAGRAM) (2 TURNS)
        {
            id: 'recipe-social-post',
            name: 'Social Media Post',
            family: 'create',
            variables: [
                {
                    key: 'KANAL_PERSON',
                    name: 'KANAL_PERSON',
                    label: 'Kanal / Absender (optional)',
                    description: 'Leer lassen für automatische Erkennung aus dem Mailverlauf oder gezielt vorgeben',
                    placeholder: 'z.B. Geschäftsleitung, Projektentwicklung, Bewirtschaftung, Social-Media-Kanal...',
                    default: 'Gemäss E-Mail-Verlauf (Executive Persona / Fachbereichsleitung / Unternehmenskanal)',
                    required: false
                }
            ],
            turns: [
                {
                    title: 'LAGEBILD & ENTWURFS-CHALLENGE',
                    role: 'Du bist ein erfahrener Executive Social-Media-Stratege und Ghostwriter.',
                    chunks: [
                        'I-MAIL',
                        { chunkId: 'R-FULL', params: { focus: 'Projektkontext, bisherige Positionierungen, Partnerrollen (Stadt/Kanton/Planer), Faktenstand und verfügbare Bild-/Video-Assets' } },
                        'C-REQUEST',
                        'T-TLDR'
                    ]
                },
                {
                    title: 'POST-ENTWURF & VISUAL-BRIEFING',
                    role: 'Du bist ein erstklassiger Executive Ghostwriter und Social-Media-Redakteur.',
                    chunks: ['O-POST']
                }
            ],
            forks: ['O-REPLY', 'O-QA', 'O-ARTICLE-DRAFT']
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
