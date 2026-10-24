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
- Fakten- und Strategietreue: Stütze dich strikt auf die gesicherten Erkenntnisse; markiere offene Punkte bei Bedarf mit «[Offen / Zu prüfen]».`;

    // Atomic Chunk Definitions
    const CHUNKS = {
        // --- INTAKE ADAPTERS ---
        'I-MEDIA': {
            id: 'I-MEDIA',
            title: 'Inhalts-Analyse & Triage (Medien/Fragen)',
            text: `TASK: FRAGENKATALOG, TYPOLOGIE & THESEN-CHECK
Analysiere die Medienanfrage im Mailtext sowie allfällige Anhänge/Links:
1. **Kernfrage & Teilfragen:** Isoliere das übergeordnete Thema, alle expliziten/impliziten Teilfragen (nummeriert) sowie Fristen/Deadlines.
2. **Fragen-Typologie & Stossrichtung:** Unterscheide rein sachliche Einzelfragen von kaskadierenden, suggestiven oder manipulativen Fragen. Welches Narrativ (Storyline) verfolgt der Journalist?
3. **Kritischer Thesen-Check (Steel-Manning):** Prüfe enthaltene Unterstellungen oder Vorannahmen: Was ist der wahre Kern bzw. das stärkste Gegenargument, und welche Annahmen sind faktisch unhaltbar?

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
Analysiere den vorliegenden E-Mail-Verlauf (Chronologie von unten nach oben beachten) sowie allfällige verlinkte SharePoint-/OneDrive-Dokumente oder Dateianhänge:
- **Aktueller Auftrag & Erwartung (oberste Nachricht):** Wer verlangt von mir konkret welche Antwortleistung, Entscheidung, Freigabe oder Einschätzung (inkl. Kern- und Teilfragen)?
- **Thread-Historie & Positionen:** Was ist im bisherigen Verlauf sachlich passiert und welche Festlegungen wurden bereits getroffen?
- **Gesicherte Fakten & Akteure:** Welche belastbaren Daten/Zahlen liegen im Thread oder in Anhängen vor, und welche Schlüsselpersonen (Absender, CC, Einheiten) sind involviert?`
        },
        'I-DOC': {
            id: 'I-DOC',
            title: 'Inhalts-Analyse (Dokumentenprüfung)',
            text: `TASK: INHALTS-ANALYSE
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
            title: 'Kontext-, Zielgruppen- & Deck-Analyse (Präsentation)',
            text: `TASK: MODUS, ZIELGRUPPE & ENTSCHEIDUNGS-PSYCHOLOGIE
Analysiere den E-Mail-Verlauf sowie verlinkte/angehängte Dokumente oder Folien (SharePoint, OneDrive, Anhang):
1. **Arbeitsmodus:** Bestimme, ob **MODUS A (Neukonzeption/Outline aus Kontext ohne bestehende PPT)** oder **MODUS B (Review & Umbau eines verlinkten/angehängten Foliendecks)** vorliegt.
2. **Gremium & Mandat:** Wer ist das Zielpublikum, nach welcher Logik entscheidet es, und welcher exakte Beschluss/Effekt muss am Ende stehen?
3. **Der «Elefant im Raum»:** Welcher unausgesprochene Vorbehalt, Zielkonflikt, Kosten- oder Risikopunkt blockiert die Zustimmung am stärksten?

TASK: DRAMATURGIE- (SCQA) & BELASTBARKEITS-PRÜFUNG (LEAK-TEST)
- **SCQA- & Substanz-Diagnose:**
  * *Bei MODUS A:* Extrahiere die tragfähigen Fakten, Zahlen und offenen Lücken für Situation (S), Handlungsdruck/Komplikation (C), Kernfrage (Q) und Kernantrag (A).
  * *Bei MODUS B:* Prüfe das Deck Folie für Folie auf Brüche im roten Faden, schwache Themen-Titel («Status», «Hintergrund» statt aktiver Action Titles), Textwüsten und redundante Folien.
- **Politische & mediale Verwundbarkeit (Leak- & Gegner-Test):**
  * Welche Aussagen, Zahlen oder Formulierungen wären bei einer Indiskretion (Medien-Leak, Öffentlichkeitsgesetz, politische Anfrage) ohne mündliche Tonspur angreifbar oder skandalisierbar?
  * Was ist das härteste Gegenargument (Steel Man) einer kritischen Aufsichts-, Politik- oder Medieninstanz?`
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
            title: 'Zeitfenster-Vorbereitung',
            compile: (params) => {
                const withTopic = params?.withTopic === true;
                const headerLines = withTopic
                    ? `THEMA / PROJEKT: {THEMA}\nZIELGRUPPE / EMPFÄNGER: {PERSON}\nZEITRAUM: {ZEITRAUM}`
                    : `ZEITRAUM: {ZEITRAUM}`;
                const topicScope = withTopic
                    ? `\n- Fokussiere die Auswertung gezielt auf das Thema «{THEMA}» und den Informationsbedarf von «{PERSON}».`
                    : '';
                return `${headerLines}

TASK: ZEITFENSTER- & FOKUS-VORBEREITUNG
Lege die zu analysierenden Zeitabschnitte anhand des angegebenen Zeitraums fest:
- Hauptarbeitszeitraum (Rückblick & relevante Entwicklungen)
- Abwesenheitstage / freie Tage bzw. Zwischenzeitraum
- Aktueller Stand bis heute${topicScope}`;
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
- Benenne zu jedem zentralen Fakt kurz die Quelle und markiere offene Punkte als «[Offen / Zu prüfen]».`;
            }
        },
        'R-TIME': {
            id: 'R-TIME',
            title: 'Recherche (Zeitfenster Microsoft Graph)',
            compile: (params) => {
                const withTopic = params?.withTopic === true;
                const topicClause = withTopic ? ` mit engem Bezug zum Thema «{THEMA}»` : '';
                return `TASK: RECHERCHE VIA MICROSOFT GRAPH
Durchsuche alle gesendeten und empfangenen E-Mails, Teams-Chats, Kalendereinträge und SharePoint-Aktivitäten innerhalb des definierten Zeitfensters${topicClause}.
Basiere alle Auswertungen ausschliesslich auf echten Daten aus Microsoft Graph; erfinde keine Einträge und kennzeichne Informationslücken explizit.`;
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
            title: 'Kritischer Sachverhalts-Check',
            text: `TASK: KRITISCHER SACHVERHALTS- & REALITÄTS-CHECK
Hinterfrage das an mich herangetragene Anliegen nüchtern vor einer Entscheidung oder Antwort:
- **Kern & Berechtigung (Steel Man):** Was ist der berechtigte Kern des Anliegens und auf welchen ungesicherten Annahmen fusst es?
- **Gegenargumente & Blinde Flecken:** Welche Risiken, Zielkonflikte, Präzedenzwirkungen oder relevanten Gegenpositionen werden im Anliegen ausgeblendet?`
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
                const includeFormatAnalysis = params?.includeFormatAnalysis === true;
                const formatBlock = includeFormatAnalysis ? `

TASK: BEANTWORTUNGS-ARCHITEKTUR & ABKLÄRUNGS-ÖKONOMIE
Wäge bei mehreren Fragen ab, welches Format Themenhoheit sichert und internen Abklärungsaufwand minimiert:
- **Option A (Punkt-für-Punkt):** Nur bei rein sachlichen, unkritischen Einzelfragen mit bereits gesicherten Fakten. Risiko: Übernahme fremden Framings & Detailverzettelung.
- **Option B (Summarische Antwort):** Zusammenhängendes Statement auf übergeordneter Flughöhe – ideal bei falschen Vorannahmen, suggestiven Fragen oder zur Vermeidung unnötiger interner Detailrecherchen.
- **Option C (Hybrid / Geclustert):** Einleitendes Haltungsstatement + gebündelte Beantwortung der Sachfragen in 2–3 Themenblöcken.
*Entscheide verbindlich (A, B oder C) und begründe, wie diese Flughöhe Fachstellen schont und dennoch alle berechtigten Fragen substanziell abdeckt.*` : '';

                return `TASK: STRATEGIE-ABWÄGUNG
Wäge die Antwortstrategien (${framings}) mit Chancen, Risiken sowie den härtesten Gegenargumenten von Medien oder Politik gegeneinander ab.${formatBlock}

TASK: EMPFOHLENE HALTUNG & STORYLINE
1. **Grundhaltung:** Lege dich auf die belastbarste Strategie fest und formuliere die Haltung in genau einem prägnanten Satz.
2. **Storyline & Argumente:** Entwickle den roten Faden und leite daraus priorisierte Haupt- und Unterstützungsargumente ab.`;
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
            text: `TASK: HANDLUNGSOPTIONEN & EMPFEHLUNG
Zeige die realistischen Handlungsoptionen auf (z.B. Freigabe ohne Auflagen, Freigabe mit Anpassungen, Überarbeitung, Nichtfreigabe bzw. kommunikativer Handlungsbedarf Ja/Nein) und bewerte kurz Vor- und Nachteile.
Lege dich verbindlich fest und formuliere die empfohlene Haltung bzw. den Kernentscheid in genau einem prägnanten Satz.`
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
            title: 'Präsentations-Strategie, Argumentation & Horizontale Storyline',
            text: `TASK: STRATEGISCHE WEGWAHL & DRAMATURGIE
Triff auf Basis des Lagebilds eine klare Richtungsentscheidung:
- **Bei bestehendem Deck (MODUS B):** Entscheide begründet zwischen **Weg 1: Gezieltes Folien-Upgrade** (Struktur behalten, Titel in scharfe Action Titles umwandeln, Textwüsten auf 3–4 Kernaussagen kürzen, heikle Stellen abdichten) und **Weg 2: Strukturelles Redesign** (Neubau entlang einer 5–8-Folien-Entscheidungsdramaturgie + Backup).
- **Bei Neukonzeption (MODUS A):** Wähle und begründe die wirksamste Dramaturgie für das Zielpublikum:
  1. *BLUF / Entscheidungs-Dramaturgie:* Kernantrag zuerst → 3 Begründungssäulen → Risikominimierung & Umsetzung (für zeitknappe Gremien/GL).
  2. *Problem-Lösungs-Spannungsbogen (SCQA):* Handlungsdruck/Kosten des Nichtstuns → Optionenvergleich → Zieloption (bei Skepsis oder Richtungsentscheid).
  3. *Einordnungs- & Vertrauens-Dramaturgie:* Gemeinsame Ziele & Faktenbasis → Abwägung der Zielkonflikte → Leitplanken & nächste Schritte (bei politisch/emotional heiklen Themen).

TASK: LEITBOTSCHAFT & 3 TRAGENDE ARGUMENTATIONSSÄULEN
1. **Leitbotschaft (Governing Thought):** Formuliere die zentrale Gesamtaussage bzw. Beschlussempfehlung in genau einem präzisen, politisch und medial unangreifbaren Satz.
2. **Die 3 Argumentationssäulen:** Entwickle die 3 stärksten Hauptargumente und weise pro Säule knapp nach: (a) **Faktenbeleg aus dem Kontext**, (b) **Zielgruppen-Hebel (ausgeräumter Vorbehalt)**, (c) **Politische & mediale Belastbarkeit**.

TASK: HORIZONTALE STORYLINE (DIE ACTION-TITLE-KETTE)
Entwirf das Rückgrat der Präsentation als fortlaufende, nummerierte Liste aller geplanten **Action Titles (ganze, aktive Aussagesätze pro Folie)**.
*Qualitätsgesetz:* Nacheinander gelesen müssen diese Action Titles allein eine lückenlose, logisch zwingende Geschichte ergeben – ohne gedankliche Sprünge und ohne generische Themen-Überschriften.`
        },
        'A-AUDIT-ALL': {
            id: 'A-AUDIT-ALL',
            title: '3D-Audit (Fakten, Logik, Reputation)',
            text: `TASK: SYSTEMATISCHES DREI-DIMENSIONEN-AUDIT
Prüfe die Vorlage rigoros in drei Dimensionen:
1. FAKTENCHECK: Sachliche Richtigkeit, Vollständigkeit, Aktualität und korrekte Einordnung von Zahlen, Daten und Zusammenhängen (Abgleich mit E-Mail-Verlauf und Microsoft Graph/SharePoint).
2. LOGIKCHECK: Innere Konsistenz, Nachvollziehbarkeit, unbegründete Schlussfolgerungen, Widersprüche und gedankliche Sprünge.
3. REPUTATIONSCHECK: Perspektive eines kritischen Journalisten, politischen Gegners oder skeptischen Stakeholders (negative Framings, Angriffsflächen, Risiken für die Glaubwürdigkeit).

WICHTIG: Gib die Einzelbefunde nicht als doppelte Vorab-Fliesstextliste aus, sondern führe alle konkreten Beanstandungen und minimalinvasiven Korrekturvorschläge direkt in der nachfolgenden Rückmeldungstabelle zusammen.`
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
            title: 'Medienantwort & Begründung',
            text: `TASK: MEDIENANTWORT & KURZBEGRÜNDUNG
Formuliere auf Basis der festgelegten Strategie, Storyline und Beantwortungs-Architektur den versandfertigen Entwurf der Medienantwort sowie direkt dazu eine prägnante Begründung:

1. **MEDIENANTWORT (VERSANDFERTIGER ENTWURF):**
   - **Format & Flughöhe:** Setze das gewählte Format (Summarisch als geschlossenes Statement, Hybrid/Geclustert nach Themenblöcken oder Punkt-für-Punkt) konsequent und ohne Rechtfertigungston um.
   - **Autonomie & Aufwand-Minimierung:** Stütze den Text strikt auf die bereits gesicherten Fakten, sodass keine neuen Recherche-Schleifen in den Fachbereichen ausgelöst werden. Falls ein einziger harter Blocker-Fakt noch bestätigt werden muss, markiere ihn exakt als «[Kurze Bestätigung durch Fachbereich X: ...]».
   - **Qualitäts- & Evasion-Check:** Faktisch belastbar, frei von PR-Floskeln, konsistent mit der Haltung; alle berechtigten Informationsbedürfnisse substanziell abgedeckt (kein Vorwurf des Ausweichens).

2. **BEGRÜNDUNG DES ENTWURFS (MAX. 4 SÄTZE):**
   - Liefere direkt neben bzw. unmittelbar zum Antwortentwurf in **maximal 4 prägnanten Sätzen** die Begründung für den gewählten Entwurf: Warum wurden genau diese Flughöhe, Struktur und Formulierung gewählt, wie sichert der Text die Themenhoheit und welche Risiken oder Detailfallen werden damit bewusst umschifft?`
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
            text: `TASK: WOCHENSTART-BERICHT

E-MAIL-VORLAGE (VERSANDFERTIG FÜR OUTLOOK):
BETREFF: «Briefing: Status, Delta & Inbox-Triage [Aktuelles Datum]»

## RÜCKBLICK & LEARNINGS
[Zusammenfassung & strategische Erkenntnisse]

## UPDATE ABWESENHEIT
[Ereignisse während der freien Tage]

## DELTA-ANALYSE
[Veränderungen & Eskalationen im Vergleich zum Vorstatus]

## INBOX TRIAGE
| Priorität | Absender | Betreff | Empfohlene Aktion | Begründung |
|-----------|----------|---------|-------------------|------------|`
        },
        'O-UPDATE': {
            id: 'O-UPDATE',
            title: 'Rückkehrer-Update',
            text: `TASK: RÜCKKEHRER-UPDATE
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
Verfasse direkt den vollständigen, publikationsreifen Artikel auf Basis der erstellten Outline und der gesicherten Recherche (allfällige noch offene Detailpunkte als «[Offen: ...]» im Text markieren).
Qualitätskriterien:
- Fesselnder Einstieg (Lead),
- Stringenter roter Faden ohne Brüche,
- Anschauliche Sprache, absolut frei von KI-Floskeln,
- Faktengetreu und zitierfähig.`
        },
        'O-PPT-STORYBOARD': {
            id: 'O-PPT-STORYBOARD',
            title: 'Folien-Storyboard & Konkrete Folien-Inputs',
            text: `TASK: AUSGEARBEITETES FOLIEN-STORYBOARD & KONKRETE FOLIEN-INPUTS
Setze die Strategie und die horizontale Action-Title-Kette in ein sofort nutzbares Folien-Konzept um. Verzichte auf generische Platzhalter oder banale Deko-Tipps («Icons einfügen») und arbeite ausschliesslich mit den konkreten Fakten und Zahlen des Falls.

Gliedere jede Folie nach folgendem Schema:
---
### FOLIE [Nr.]: [Dramaturgische Funktion – bei MODUS B zusätzlich Bezug zur Ist-Folie, z.B. «Ersetzt Folie 3–4» / «Überarbeitung Folie 2» / «Neu»]
- **ACTION TITLE (Headline):** [Vollständiger, aktiver Aussagesatz mit der Kernbotschaft – keine Schlagworte wie «Ausgangslage» oder «Status»]
- **DRUCKREIFER FOLIENINHALT (MAX. 3–4 KERNAUSSAGEN):**
  * [Ausformulierte, kontextgesättigte Stichpunkte im konkreten Wortlaut inkl. Zahlen/Belegen; fehlende Einzeldaten als «[Datenpunkt X ergänzen]» markieren]
  * [Jede Aussage muss den **Leak-Test** bestehen: auch ohne mündliche Tonspur sachlich unangreifbar, politisch ausgewogen und medial nicht skandalisierbar]
- **BEWEIS- & STRUKTURLOGIK:** [Inhaltliche Beweisführung auf der Folie, z.B. Status quo vs. Zielbild, Optionen-Matrix nach 3 Kriterien, Kausalkette Ursache → Wirkung → Massnahme]
- **ZIELGRUPPEN-HEBEL & ROTSTIFT:** [Welchen Einwand räumt die Folie aus – und was muss gegenüber dem Entwurf bzw. heiklen Formulierungen konkret gestrichen oder geschärft werden («Statt X → Besser Y»)?]
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
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { scope: 'media' } }, 'C-DRAFT', 'T-TLDR']
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
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { focus: 'bisherige Berichterstattung, bisherige Unternehmens- bzw. Organisations-Positionierungen, Journalistin/Journalist und Medium' } }, 'T-TLDR']
                },
                {
                    title: 'STRATEGIE',
                    role: 'Du bist ein erfahrener Kommunikationsstratege.',
                    chunks: [{ chunkId: 'S-FULL', params: { includeFormatAnalysis: true } }, { chunkId: 'S-MESSAGES', params: { count: 'vier' } }]
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
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { scope: 'media' } }, 'T-TLDR']
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
                    chunks: ['S-DECISION', 'O-ACTIONS']
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
                    chunks: ['A-AUDIT-ALL', 'S-DECISION', { chunkId: 'O-TABLE', params: { withSummary: true } }]
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
                    chunks: [
                        { chunkId: 'I-TIME', params: { withTopic: true } },
                        { chunkId: 'R-TIME', params: { withTopic: true } },
                        'T-TLDR'
                    ]
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
            ? 'Führe diesen mehrstufigen Workflow komplett in einer einzigen Antwort aus: Halte die Vorstufen (Analyse & Strategie) kompakt in prägnanten Stichpunkten, damit das Hauptgewicht auf dem direkt nutzbaren Endresultat im letzten Schritt liegt.'
            : 'Führe diesen Auftrag direkt und präzise aus.';
        const header = `${recipe.name.toUpperCase()} (EXPRESS-MODUS)\n${execInstruction}`;
        const turnTexts = recipe.turns.map((_, i) => compileTurn(recipe, i, { variableValues, isExpress: true }));
        return [header, ...turnTexts].join('\n\n---\n\n');
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
