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
2. **Fragen-Typologie & Stossrichtung:** Unterscheide rein sachliche Einzelfragen von kaskadierenden, suggestiven oder manipulativen Fragen. Welches Narrativ (Storyline) verfolgt der Journalist?
3. **Thesen- & Vorlagen-Check:** Prüfe enthaltene Unterstellungen oder Vorannahmen (wahrer Kern vs. faktisch unhaltbare Annahmen) sowie allfällige im Thread bereits vorliegende interne Antwortentwürfe auf Angriffsflächen.

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
- **Unmittelbares Anliegen & Entscheidungsbedürfnis (oberste Nachricht):** Was will die anfragende Person *jetzt* konkret entscheiden oder klären (z.B. vorläufige Tendenzaussage zur eigenen Aufwands-/Planungssicherheit vs. definitive Freigabe vs. Prozessauskunft)?
- **Thread-Historie & Entscheidungslogik:** Was ist bisher passiert, welche Festlegungen gelten bereits und von welchem konkreten Meilenstein, Stichtag oder Leistungsnachweis hängt eine belastbare Aussage ab?
- **Gesicherte Fakten & Akteure:** Welche belastbaren Daten, Termine oder Formular-/Vertragsvorgaben liegen vor, und welche Schlüsselpersonen sind involviert?`
        },
        'I-DOC': {
            id: 'I-DOC',
            title: 'Inhalts-Analyse (Dokumenten-, Setting- & Folienprüfung)',
            text: `TASK: PUBLIKATIONSSETTING, ZIELPUBLIKUM & FAKTENGRENZEN-ANALYSE
Analysiere die verlinkte/angehängte Datei (Textentwurf, Beitrag, Präsentation, Q&A) samt E-Mail-Verlauf:
1. **Publikationssetting & Drei-Stufen-Zielpublikum:**
   - **Setting & Auftrag:** Kläre vorab Format und Absenderinteresse (*Behörden-/Gremienvorlage* vs. *Paid Content / Jubiläums- oder Unternehmenspublikation / Partnerschaft* vs. *unabhängiger Medienbeitrag*). *(Falls im Thread nicht erkennbar, weise explizit darauf hin, damit es für Schritt 2 gesteuert werden kann).*
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
            title: 'Kritischer Sachverhalts- & Entscheidungslogik-Check',
            text: `TASK: KRITISCHER SACHVERHALTS- & ENTSCHEIDUNGSLOGIK-CHECK
Hinterfrage das an mich herangetragene Anliegen nüchtern vor einer Entscheidung oder Antwort:
- **Kern & Berechtigung (Steel Man):** Was ist das legitime Planungs- oder Informationsbedürfnis des Absenders – und welche ungesicherten Annahmen stecken darin?
- **Materielle Voraussetzung & Vorfreigabe-Risiko:** Falls eine Zusage oder Prüfung erst nach einem künftigen Meilenstein (z.B. Inbetriebnahme, Abnahme, Entscheid) möglich ist: Was ist der **sachliche Hauptgrund** dafür (z.B. Nachweis, dass die Leistung die vereinbarten Anforderungen erfüllt), und wie geben wir faire Orientierung ohne unbeabsichtigte Vorfreigabe oder Präzedenzwirkung?`
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

TASK: BEANTWORTUNGS-ARCHITEKTUR & ABKLÄRUNGS-ÖKONOMIE
Wäge ab, welches Format Themenhoheit sichert und internen Abklärungsaufwand minimiert:
- **Option A (Punkt-für-Punkt):** Nur bei rein sachlichen, unkritischen Einzelfragen mit bereits gesicherten Fakten (Risiko: Übernahme fremden Framings & Detailverzettelung).
- **Option B (Summarische Antwort):** Geschlossenes Statement auf übergeordneter Flughöhe – ideal bei falschen Vorannahmen, suggestiven Fragen oder zur Vermeidung unnötiger Detailrecherchen.
- **Option C (Hybrid / Geclustert):** Einleitendes Haltungsstatement + gebündelte Beantwortung der Sachfragen in 2–3 Themenblöcken.
*Entscheide verbindlich (A, B oder C) und begründe kurz, wie diese Flughöhe Fachstellen schont und alle berechtigten Fragen substanziell abdeckt.*` : '';

                return `TASK: STRATEGIE-OPTIONEN, FRAMING-ZIEL & STORYLINE
1. **Konkrete Strategie-Optionen:** Stelle die 2–3 realistischsten strategischen Handlungs- bzw. Antwortoptionen für diesen konkreten Fall (inkl. Chancen, Risiken und härtestem Gegenargument) knapp gegenüber.
2. **Framing-Ziel & Nicht-Festlegung (Leitplanke):** Lege dich verbindlich fest und definiere präzise: Was soll die Antwort erklären, welche Haltung vermittelt sie, und worauf darf sie die Organisation keinesfalls festlegen (Schutz des Lösungsraums)?
3. **Storyline & Hauptargumente:** Skizziere den roten Faden und die 2–3 tragenden, faktenbasierten Hauptargumente.${formatBlock}`;
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
            title: 'Strategische Vorprüfung & Entscheid',
            text: `TASK: STRATEGISCHE KONZEPT-VORPRÜFUNG & ENTSCHEID
Beurteile vor dem Detailaudit zuerst auf Gesamtebene: Passt das bestehende Konzept zum Publikationssetting und Kommunikationsauftrag (**a: Konzept stimmig / punktuelle Anpassung genügt** | **b: inhaltliche Neugewichtung der Rolle/Leistung nötig** | **c: grundlegende Überarbeitung / alternatives Konzept bzw. Handlungsbedarf Ja/Nein**)?
Bewerte kurz die Optionen, lege dich verbindlich fest und formuliere den Kernentscheid in genau einem prägnanten Satz.`
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
2. **KONZEPT-, ROLLEN- & TERMINOLOGIE-KONSISTENZ:**
   - Stelle sicher, dass die übergeordnete Rolle und Kernleistung unserer Organisation im Gesamtkontext korrekt eingeordnet ist (keine verkürzte Darstellung von Teilbereichen). Bereinige Dubletten/Varianten (verbindlich auf **eine** Variante festlegen) und halte Schlüsselbegriffe konsistent (\`Nicht «X», sondern «Y»\`).
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
Erstelle auf Basis der festgelegten Strategie und Beantwortungs-Architektur die versandfertige Medienantwort in exakt diesen drei Schritten:

1. **FRAMING-ZIEL & BEGRÜNDUNG DER LINIE (VORAB-LEITPLANKE, MAX. 4 SÄTZE):**
   - Definiere vor dem Entwurf knapp: Was soll die Antwort erklären (und warum auf dieser Flughöhe), welche Haltung vermittelt sie, und **worauf darf sie die Organisation keinesfalls festlegen**? Richte den gesamten nachfolgenden Entwurf strikt an dieser Zielhierarchie aus.

2. **MEDIENANTWORT (VERSANDFERTIGER ENTWURF):**
   - **Faktenstatus-Disziplin:** Trenne die Verbindlichkeitsgrade (*fachlich geprüft und beschlossen* | *geplant oder vorgesehen* | *in Prüfung* | *offen*) strikt; vermeide jeden Widerspruch zwischen bestätigten Terminen und noch offenen Zeitpunkten. Falls ein einziger Blocker-Fakt noch bestätigt werden muss, markiere ihn exakt als «[Kurze Bestätigung durch Fachbereich X: ...]».
   - **Notwendige Konkretion (Lösungsraum schützen):** Formuliere so konkret wie für die Beantwortung erforderlich, aber nicht konkreter als der bestätigte Entscheidungsstand. Wo Begriffe zu Massnahmen, Materialien, Nutzungen, Mengen, Terminen oder Ausführungsformen den Lösungsraum unnötig einschränken, verwende zwingend einen verständlichen Oberbegriff.
   - **Satzfunktion:** Jeder Satz muss eine eindeutige kommunikative Funktion erfüllen (*Bedeutung/Betroffenheit anerkennen* | *gesicherten Sachverhalt nennen* | *Entscheid begründen* | *Haltung erklären* | *bestätigten Ausblick geben* | *offene Ausgestaltung korrekt abgrenzen*). Streiche Wiederholungen und Sätze ohne Informationswert. Behalte kurze Einzelsätze bei, wenn sie unterschiedliche Funktionen erfüllen.

3. **ABSCHLIESSENDER QUALITÄTS-CHECK DES FINALEN ENTWURFS (SCHEMA a–d):**
   Prüfe den Entwurf abschliessend Punkt für Punkt gegen dieses Schema (jeweils 1 Prüfsatz als Nachweis; bei Verstoss den Entwurf oben vor der Ausgabe zwingend korrigieren):
   - **a) Medial und politisch belastbar:** Hält jede Aussage einer kritischen Nachprüfung stand, ohne neue Angriffsflächen zu öffnen?
   - **b) Nahbar, menschlich und verständlich:** Klingt der Text glaubwürdig, empathisch und frei von bürokratischer Distanz?
   - **c) Keine Wiederholung oder indirekte Bestätigung von Vorwürfen / Hypothesen:** Wurden Unterstellungen, Reizworte und hypothetische Konfliktszenarien der Anfrage konsequent gemieden (auch nicht durch defensive Verneinung wiederholt)?
   - **d) Eigenes Narrativ:** Transportiert die Antwort aus eigener Kraft unsere Kernbotschaft und Perspektive, statt nur reaktiv Fragen abzuarbeiten?`
        },
        'C-MEDIA-CHECK': {
            id: 'C-MEDIA-CHECK',
            title: 'Medienantwort-Check (Festlegung 1–4 & Schema a–d)',
            text: `TASK: ENTSCHEIDUNGS- UND FESTLEGUNGS-CHECK (VORPRÜFUNG 1–4)
Prüfe vor der sprachlichen Überarbeitung jeden zentralen Inhalt des vorliegenden Medienantwort-Entwurfs nach diesen vier Punkten:
1. **Faktenstatus:** Ordne jede Aussage eindeutig einer Stufe zu (*fachlich geprüft und beschlossen* | *geplant oder vorgesehen* | *in Prüfung* | *offen*). Vermische diese Verbindlichkeitsgrade nicht und decke Widersprüche zwischen bestätigten Terminen und angeblich noch offenen Zeitpunkten auf.
2. **Notwendige Konkretion:** Prüfe, ob der Text so konkret wie nötig, aber nicht konkreter als der bestätigte Entscheidungsstand formuliert ist. Wo Begriffe zu Massnahmen, Materialien, Nutzungen, Mengen, Terminen oder Ausführungsformen den verbleibenden Lösungsraum unnötig einschränken, ersetze sie durch einen verständlichen Oberbegriff.
3. **Satzfunktion:** Prüfe, ob jeder Satz eine eindeutige kommunikative Funktion erfüllt (*Bedeutung oder Betroffenheit anerkennen* | *gesicherten Sachverhalt nennen* | *Entscheid begründen* | *Haltung der Organisation erklären* | *bestätigten Ausblick geben* | *offene Ausgestaltung korrekt abgrenzen*). Streiche Wiederholungen und Sätze ohne zusätzlichen Informationswert; behalte kurze Einzelsätze bei, wenn sie unterschiedliche Funktionen erfüllen.
4. **Framing-Ziel:** Formuliere vorab in einem Satz die Zielhierarchie: Was soll die Antwort erklären, welche Haltung soll sie vermitteln, und worauf darf sie die Organisation nicht festlegen?

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
            title: 'Antwortentwurf (E-Mail)',
            text: `TASK: EMPFOHLENE LINIE & ANTWORTENTWURF
1. **Empfohlene Reaktionslinie (1 Satz):** Formuliere den Kernentscheid bzw. die empfohlene Haltung (inkl. allfälliger Bedingung und Abgrenzung gegen eine Vorfreigabe) in genau einem prägnanten Satz.
2. **Versandfertiger Antwortentwurf:** Formuliere direkt darunter den präzisen, direkt versandfertigen E-Mail-Entwurf nach diesen vier Regeln:
   - **Anliegens-Fokus:** Beantworte exakt das, was die anfragende Person für ihren aktuellen Entscheidungsschritt braucht (z.B. Verständnis für das Planungsbedürfnis + klare Tendenzaussage unter Prüfvorbehalt, aber ohne faktische Vorfreigabe oder Zusage-Automatismus).
   - **Sachgrund hinter Meilensteinen:** Falls eine Prüfung erst nach einem künftigen Stichtag/Meilenstein (mit Datum) erfolgt, benenne knapp den materiellen Grund (z.B. Feststellung nach Inbetriebnahme/Abnahme, ob die Arbeiten die vereinbarten Anforderungen erfüllen) statt blosser Prozessbürokratie.
   - **Objektive Aussensprache:** Übersetze subjektive interne Kriterien («wenn alle zufrieden sind», «in der Regel kein Problem») in sachlich überprüfbare externe Kriterien («sofern die ausgeführten Arbeiten die vereinbarten Anforderungen erfüllen»).
   - **Keine Nebenbedingungs-Kaskaden:** Nenne nur Voraussetzungen, die den aktuellen Schritt unmittelbar steuern; decke nachgelagerte Detail- oder Formularpflichten kompakt per Verweis auf bestehende Vorgaben/Formulare ab, statt sie einzeln aufzuzählen.`
        },
        'O-QA': {
            id: 'O-QA',
            title: 'Q+A Tabelle',
            text: `TASK: KRITISCHES Q+A (8–10 FRAGEN)
Erstelle ein kompaktes Q+A mit den 8 bis 10 wahrscheinlichsten und heikelsten Fragen eines kritischen Journalisten inkl. souveräner Antwort und kurzer Begründung der Linie:
| Kritische Frage | Empfohlene Antwort (zitierfähig) | Begründung / Fokus |
|-----------------|----------------------------------|--------------------|`
        },
        'O-INTERVIEW': {
            id: 'O-INTERVIEW',
            title: 'Interview- & Medienbriefing',
            text: `TASK: INTERVIEW- UND MEDIENBRIEFING
Erstelle das kompakte, sofort einsatzbereite Interview-Briefing in exakt folgender Struktur:
1. **Ziel, Rahmen & Rolle:** Ziel des Gesprächs und Positionierung unserer Vertretung (2–3 Sätze).
2. **Grundhaltung (1 Satz):** [Prägnanter Leitsatz für den Auftritt]
3. **Vier zitierfähige Kernbotschaften:** [Knapp und einprägsam]
4. **Fragenkatalog mit Antwortempfehlungen:**
| Kritische Frage | Taktischer Fokus (was betonen / was meiden) | Souveräner Antwortvorschlag |`
        },
        'O-STRATEGY': {
            id: 'O-STRATEGY',
            title: 'Kommunikationsstrategie Dokument',
            text: `TASK: KOMPAKTE KOMMUNIKATIONSSTRATEGIE
Erstelle eine fokussierte, entscheidungsreife Kommunikationsstrategie in exakt 6 Kernblöcken:
1. **HERAUSFORDERUNG & ZIEL:** Ausgangslage, kommunikatives Kernproblem und konkretes Erfolgsziel.
2. **STRATEGISCHE HALTUNG & FRAMING:** Empfohlene Grundhaltung (1 Leitsatz) und tragendes Narrativ.
3. **KERNBOTSCHAFTEN (MAX. 4) & STORYLINE:** Zitierfähige Kernbotschaften und roter Faden in 3–5 Sätzen.
4. **STAKEHOLDER & ARGUMENTARIUM:** Wichtigste Zielgruppen sowie Hauptargumente inkl. Faktenbeleg.
5. **PRIORISIERTE MASSNAHMEN & TIMING:** Konkreter Fahrplan (Was | Wann | Kanal/Akteur).
6. **RISIKEN, DO'S/DON'TS & TOP-3 KRITISCHE FRAGEN:** Wichtigste Fallstricke sowie souveräne Kurzantworten auf die 3 heikelsten Fragen.`
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
- **ZIEL & EMPFOHLENE LINIE (1 SATZ):** [Mein Kernziel und meine Haltung im Termin]
- **MEINE ROLLE & ERWARTUNG:** [Welcher Entscheid oder Beitrag ist von mir gefragt?]
- **AKTIV ZU PLATZIERENDE BOTSCHAFTEN (2–3 PUNKTE):** [...]
- **HEIKLE PUNKTE & GEGENFRAGEN:** [Kritischer Punkt → Souveräne Reaktion]
- **DO'S & DON'TS:** [Konkrete Gesprächsleitplanken]`
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
            text: `TASK: PUBLIKATIONSRAHMEN, AUFHÄNGER & ARTIKEL-OUTLINE
1. **Publikationsrahmen & Zielgruppe:** Definiere kurz Format, Zielpublikum, Tonalität und journalistische Darstellungsform.
2. **Aufhänger & Dramaturgie (Hook):** Bestimme den stärksten Einstieg (konkretes Beispiel, Zahl, Wendepunkt oder Spannungsfeld) und den roten Faden.
3. **Detaillierte Artikel-Gliederung:** Erstelle die Abschnitts-Outline mit sprechenden Zwischenüberschriften, Kernaussagen pro Absatz und vorgesehenen Fakten/Zitaten.`
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
