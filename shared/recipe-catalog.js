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
- Unterscheide strikt zwischen gesicherten Fakten (mit kurzer Nennung der Quelle aus Mailverlauf, SharePoint/Graph, Anhang oder verifizierter Web-/Medienquelle), plausiblen Annahmen und Bewertungen.
- Fehlende Daten oder Informationslücken explizit als «[Offen / Zu prüfen]» benennen, niemals überspielen oder hinzuerfinden.`;

    // Compact style & quality discipline for Turn 2+ (Strategy & Output drafting) and Forks
    const G_OUTPUT_STYLE = `QUALITÄTS- & STILVORGABE:
- Nahbar, menschlich, sympathisch & ohne Vorwissen verständlich (Anti-Technokratie): Schreib durchgehend zugänglich, warmherzig und auf Augenhöhe – komplett frei von Technokratie, Behörden-, Planer- oder Juristendeutsch, sodass auch Menschen ohne jedes Vorwissen den Sinn beim ersten Lesen mühelos verstehen. Keine leeren Phrasen oder KI-Floskeln.
- Mehrperspektiven- & Faktentreue: Prüfe jede Aussage aus Sicht von Betroffenen/Laien, kritischer Öffentlichkeit/Medien und beteiligten Partnern. Stütze dich strikt auf gesicherte Fakten («[Offen / Zu prüfen]» bei Lücken).
- Redundanz-Sperre: Wiederhole bereits in Vorstufen festgelegte Analysen oder Herleitungen nicht erneut, sondern wende sie direkt auf das konkrete Arbeitsprodukt an.`;

    // Atomic Chunk Definitions
    const CHUNKS = {
        // --- INTAKE ADAPTERS ---
        'I-MEDIA': {
            id: 'I-MEDIA',
            title: 'Diagnostische Dekonstruktion & Abklärungs-Triage',
            text: `TASK: DIAGNOSTISCHE DEKONSTRUKTION, ROLLENKLÄRUNG & TRIAGE
Analysiere die Anfrage im Mailtext samt Vorlauf und Anhängen in der Tiefe:
1. **Oberfläche vs. Subtext & Prämissen-Falle:** Trenne die vordergründigen Sachfragen (inkl. Frist) vom unterschwelligen Subtext. Welche geladenen Begriffe, einseitigen Deutungen oder falschen Vorannahmen stecken in der Frage (bzw. in internen Vor-Entwürfen), die wir weder übernehmen noch durch Verneinung verstärken dürfen?
2. **Rollen, Zuständigkeiten & Vorbehalte:** Kläre die genaue Aufgabenteilung (unsere Verantwortung vs. Federführung oder Rolle externer Partner, Behörden und Beteiligter) sowie bestehende Entscheidungs-, Verhandlungs- oder Realisierungsvorbehalte.
3. **Abklärungs-Triage (Aufwand-Minimierung):** Ordne zu, was sich **direkt ohne interne Rückfrage** über zusammenhängende Sach-/Praxislogik und M365-Wissen souverän beantworten lässt, wo wir **bewusst auf Einzelabklärungen verzichten** (Detailfalle), und ob maximal 1 zwingender Fakten-Blocker (geschlossene Ja/Nein-Frage) besteht.`
        },
        'I-MAIL': {
            id: 'I-MAIL',
            title: 'Vorgangs-, Subtext- & Rollen-Analyse (E-Mail)',
            text: `TASK: VORGANGS-, SUBTEXT- & ROLLEN-ANALYSE
Analysiere den E-Mail-Verlauf (Chronologie von unten nach oben) samt Anhängen:
- **Eigentlicher Auftrag & Subtext:** Was ist das konkrete Ziel (**interne Einschätzung**, **Direktantwort**, **verwendbarer Textblock für Dritte** oder **strategische Weichenstellung**) und welche taktischen Fallstricke stecken im Anliegen (z.B. verfrühte Festlegung, Vermischung getrennter Themen-/Entscheidungsebenen oder ein ungünstiges Setting)?
- **Zuständigkeiten, Partner & Rohmaterial-Check:** Wer trägt für welchen Teil die Verantwortung (eigene Rolle vs. Partner, Behörden oder Gremien), welche Entscheidungsvorbehalte gelten, und wo enthält internes Rohmaterial Fachjargon, einen defensiv-belehrenden Ton oder ungesicherte Angaben?`
        },
        'I-DOC': {
            id: 'I-DOC',
            title: 'Inhalts-Analyse (Text-, Medienmitteilungs- & Dokumentenprüfung)',
            text: `TASK: PUBLIKATIONSSETTING, SUBTEXT & FAKTENGRENZEN-ANALYSE
Analysiere das vorliegende Dokument (Medienmitteilung, Textentwurf, Beitrag, Q&A) samt E-Mail-Verlauf:
1. **Setting & Zielpublika:** Kläre Format und Wirkung auf (a) **Primäres Zielpublikum (inkl. Laien ohne Vorwissen)**, (b) **kritische Öffentlichkeit/Medien (Leak-Test)** und (c) **Autorenschaft im Thread**.
2. **Framing-, Ton- & Rollen-Diagnose:** Wo tappt der Entwurf in defensives Problem-Framing (Wiederholung oder Verneinung negativer Reizwörter), Technokratie, Eigenlob/PR-Überhöhung statt sympathischer Glaubwürdigkeit, unklare Rollentrennung oder sprachliche Echos?
3. **Faktengrenzen & Sicherungen:** Wo fehlen notwendige Vorbehalte bei noch offenen Entscheiden/Optionen, und wo stehen volatile Langfrist-Prognosen oder unbelegte Versprechen?`
        },
        'I-PPT': {
            id: 'I-PPT',
            title: 'Kontext-, Zielgruppen- & Deck-Diagnose (Präsentation)',
            text: `TASK: MODUS, ENTSCHEIDUNGS-PSYCHOLOGIE & LEAK-TEST
Analysiere den E-Mail-Verlauf sowie verlinkte/angehängte Unterlagen oder Folien:
1. **Arbeitsmodus & Zielpublikum:** Bestimme **MODUS A (Neukonzeption)** vs. **MODUS B (Review/Upgrade bestehendes Deck inkl. Q&A)** sowie die Erwartungshaltung des primären Gremiums und die sekundäre Aussenwirkung (Öffentlichkeits-/Leak-Test).
2. **Der «Elefant im Raum» & Schwachstellen:** Welcher ungelöste Zielkonflikt, welche Vermischung getrennter Entscheidungsebenen oder welche technokratische Innensicht gefährdet die Überzeugungskraft am stärksten?`
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
                    ? 'bisherige und aktuelle mediale Berichterstattung, öffentlich verfügbare Fakten, frühere Stellungnahmen und historische Kontexte'
                    : 'relevante Hintergrundfakten, Projektstände, bisherige Entscheidungen, Sprachregelungen sowie bisherige und aktuelle mediale Berichterstattung zum Thema';
                const focus = params?.focus || defaultFocus;
                return `TASK: RECHERCHE, MEDIEN-RADAR & FAKTENABGLEICH (M365 GRAPH, #KOM-ANKER & WEBSUCHE)
Durchsuche aktiv sowohl interne Quellen (M365 Graph: E-Mails, Teams-Chats – priorisiere mit «#KOM-ANKER» markierte Notizen, Links und Screenshots im Self-Chat –, Besprechungsnotizen, SharePoint) als auch externe Quellen via Websuche (Online-Medien, Newsportale, veröffentlichte Medienmitteilungen) gezielt nach: ${focus}.
- **Bisherige & aktuelle mediale Berichterstattung prüfen:** Erfasse ausdrücklich, was zum Thema bereits oder aktuell in den Medien berichtet wird (Framing, Kritikpunkte, Tonalität) und welche eigenen Aussagen oder Partner-Stellungnahmen bereits öffentlich im Raum stehen (Konsistenzschutz).
- **Prämissen- & Faktenstatus-Check:** Gleiche Vorannahmen aktiv gegen unabhängige M365-/«#KOM-ANKER»- und Web-Quellen ab und ordne jede zentrale Aussage eindeutig einer Stufe zu (*fachlich geprüft und beschlossen* | *geplant oder vorgesehen* | *in Prüfung* | *offen [Zu prüfen]* inkl. Quelle).`;
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
            title: 'Taktischer Ermessens-, Mehrperspektiven- & Rollen-Check',
            text: `TASK: TAKTISCHER ERMESSENS-, MEHRPERSPEKTIVEN- & ROLLEN-CHECK
Prüfe das Anliegen eigenständig und scharfsinnig auf **Sache, Taktik und Mehrperspektiven-Wirkung**:
- **Kernanliegen vs. Taktische Fallstricke:** Was ist das berechtigte Anliegen – und wo droht bei unbedachter Reaktion ein Nachteil (z.B. verfrühte Festlegung, Vermischung getrennter Themen-/Entscheidungsebenen, ungünstiges Setting oder Vorgriff auf Partner und Gremien)?
- **Mehrperspektiven-Stresstest (3 Blickwinkel):** Wie wirkt unsere Haltung auf (1) **direkt Betroffene & Laien im Alltag** (nahbar, sympathisch und ohne Vorwissen sofort einleuchtend vs. abgehoben?), (2) **kritische Öffentlichkeit, Medien & Politik** (Angriffsfläche, Nachhak-Falle?), (3) **involvierte Partner, Behörden & Gremien** (Rollen, Abstimmung und Solidarität gewahrt?)?
- **Klügster Spielzug:** Entwickle aus der Situation heraus das wirksamste strategische und taktische Vorgehen (ob direkte sympathische Klärung, gestuftes Vorgehen zur vorgängigen Abstimmung, Anpassung von Format/Rahmen oder inhaltliches Reframing).`
        },
        'C-PERSPECTIVE': {
            id: 'C-PERSPECTIVE',
            title: 'Mehrperspektivische Einordnung (360°-Stresstest)',
            text: `TASK: KRITISCHE MEHRPERSPEKTIVEN-EINORDNUNG (360°-STRESSTEST)
Prüfe das Thema realistisch durch die Brille der drei entscheidenden Anspruchsgruppen:
- **1. Betroffene, Kundschaft & Laien im Alltag:** Wie erleben Menschen vor Ort (ohne Fachwissen) die Situation, und was braucht es, damit unsere Haltung nahbar, menschlich, sympathisch und sofort einleuchtend wirkt?
- **2. Kritische Öffentlichkeit, Medien & Politik:** Welcher Aufhänger, Widerspruch oder Vorwurf wäre für Redaktionen und Kritiker am attraktivsten?
- **3. Partner, Behörden & interne Governance:** Welche Rollen, Zuständigkeiten, Abstimmungspflichten oder Präzedenzwirkungen stehen auf dem Spiel?`
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
            title: 'Strategische & Taktische Weichenstellung',
            compile: (params) => {
                const includeFormatAnalysis = params?.includeFormatAnalysis === true;
                const formatBullet = includeFormatAnalysis
                    ? `\n3. **Beantwortungs-Architektur & Verpflichtungsgrad:** Wähle die überzeugendste Form (*Kompakte Gesamteinordnung*, *Thematisch geclustert* oder *Punkt-für-Punkt*) und kalibriere die Selbstbindung präzise (offene Entscheide sauber wahren, keine volatilen Langfrist-Prognosen, allfällige Folgekommunikation konditional formulieren statt als unbedingtes Versprechen).`
                    : '';

                return `TASK: STRATEGISCHE & TAKTISCHE WEICHENSTELLUNG (INKL. MEHRPERSPEKTIVEN-STRESSTEST)
Nutze deine volle kreative und strategische Urteilskraft, um für genau diese Situation die klügste Linie zu entwickeln:
1. **Taktische Optionen & Mehrperspektiven-Abwägung (2–3 Wege):** Entwickle eigenständig die wirksamsten strategischen und taktischen Handlungsoptionen (inkl. möglicher Sequenzierungs-, Format- oder Reframing-Spielzüge). Prüfe sie gegen die drei Perspektiven (**Betroffene/Laien im Alltag**, **kritische Medien/Politik**, **Partner/Behörden/Gremien**) und lege dich verbindlich auf die beste Linie fest.
2. **Eigenes positives Narrativ & Framing-Souveränität:** Leite aus dem konkreten Sachverhalt und dem greifbaren Nutzen für Menschen, Alltag und Umfeld unser eigenes, sympathisches und sofort einleuchtendes Narrativ ab. Übernimm oder verneine niemals fremde Vorwürfe, Reizwörter oder Negativ-Frames, sondern ersetze sie lautlos durch positive Qualitäten und nachvollziehbare Handlungslogik.${formatBullet}`;
            }
        },
        'S-LITE': {
            id: 'S-LITE',
            title: 'Taktische Linie, Nutzen-Framing & Schutzgrenzen',
            text: `TASK: EMPFOHLENE LINIE & POSITIVES NUTZEN-FRAMING
Formuliere in 2–3 prägnanten, allgemeinverständlichen Sätzen unsere empfohlene strategisch-taktische Linie, das **eigene positive Qualitäts- und Nutzen-Narrativ** (ohne fremde Reizwörter oder Negativ-Frames zu wiederholen oder zu verneinen) sowie unsere **Rollen- und Entscheidungsgrenzen** in klarer Alltagssprache.`
        },
        'S-MESSAGES': {
            id: 'S-MESSAGES',
            title: 'Sprachregelung (Basistext) & Kernbotschaften',
            compile: (params) => {
                const count = params?.count || 'drei';
                return `TASK: DIREKT VERWENDBARE SPRACHREGELUNG & KERNBOTSCHAFTEN
1. **Kompakter Basistext (1 Absatz, nahbar, menschlich & sympathisch):** Formuliere einen direkt verwendbaren, warmherzig und souverän geschriebenen Sprachregelungs-Block ohne Technokratie – so einfach und anschaulich, dass auch Menschen ohne jedes Vorwissen den Sinn sofort verstehen (mit positivem Nutzen-Framing und sauberem Vorbehalt bei offenen Entscheiden).
2. **Kernbotschaften (${count} Punkte, Outside-in):** Verdichte die Linie auf ${count} prägnante, isoliert zitierfähige Kernbotschaften in natürlicher Alltagssprache – frei von Fach- oder Behörden-Jargon, ohne Verneinung fremder Frames und ohne unbelegte Versprechen.`;
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
            text: `TASK: STRATEGISCHE LEITLINIE & DRAMATURGIE
Lege auf Basis der Diagnose die überzeugendste Linie für das Deck fest:
- **Strategische Leitlinie & Framing (1–2 Sätze):** Formuliere den tragenden Leitsatz mit eigenem positivem Nutzen-Framing sowie sauberer Trennung von Entscheidungsebenen, Partnerrollen und offenen Entscheiden.
- **Dramaturgie & Prüfkriterien:** Wähle die stärkste Dramaturgie (MODUS A: BLUF/SCQA; MODUS B: gezieltes Upgrade vs. Redesign) und definiere max. 4–5 prägnante Inhalts-/Sprachregeln (nahbar, frei von Technokratie, fair gegenüber Partnern und ohne ungesicherte Langfrist-Prognosen).

TASK: FOLIEN-TRIAGE & HORIZONTALE STORYLINE
- **Bei MODUS A:** Entwirf die fortlaufende Liste aller **Action Titles (ganze, aktive Aussagesätze pro Folie)** als lückenlose Storyline.
- **Bei MODUS B:** Klassifiziere jede Folie verbindlich nach Eingriffstiefe (**stimmig** | **kleinere Anpassung** | **grössere Anpassung** | **entfernen/Reserve**) und lege dich bei Varianten auf **eine** überzeugende Fassung fest.`
        },
        'A-AUDIT-ALL': {
            id: 'A-AUDIT-ALL',
            title: '3D-Audit (Menschlichkeit, Framing & Governance)',
            text: `TASK: SETTING-GERECHTES DREI-DIMENSIONEN-AUDIT (INKL. MEHRPERSPEKTIVEN- & LAIEN-TEST)
Gewichte alle Beanstandungen pragmatisch nach dem konkreten Publikationsauftrag (tragfähige Passagen unverändert belassen, nur echte Verbesserungen vorschlagen):
1. **NAHBARE MENSCHLICHKEIT, LAIEN-VERSTÄNDLICHKEIT & POSITIVES FRAMING:**
   - **Sympathisch, menschlich & ohne Vorwissen verständlich (Anti-Technokratie):** Übersetze Fach-, Behörden- oder Juristendeutsch sowie kühle Distanz in eine zugängliche, warme und natürliche Sprache, die jedem Laien sofort einleuchtet.
   - **Positives Nutzen-Framing & Glaubwürdigkeit:** Ersetze defensives Problem-Framing (Wiederholung oder Verneinung negativer Reizwörter) und herablassende Partikeln durch positive Qualitäten und greifbaren Mehrwert. Korrigiere Eigenlob oder PR-Überhöhungen zu glaubwürdiger Substanz und tilge Wort-/Zahlen-Echos.
2. **GOVERNANCE, ROLLENKLARHEIT & VERPFLICHTUNGSGRAD:**
   - **Keine Schein-Beanstandungen:** Beanstande Fakten nur bei echtem Widerspruch.
   - **Saubere Abgrenzung & Sicherungen:** Trenne eigene Verantwortung, Zuständigkeiten externer Partner/Behörden und unterschiedliche Verfahrensebenen präzise. Ergänze fehlende Vorbehalte bei noch offenen Entscheiden und streiche volatile Langfrist-Prognosen.
3. **MEHRPERSPEKTIVEN- & LEAK-FESTIGKEIT:**
   - Prüfe den Text durch die Brille von **Betroffenen/Laien**, **kritischen Medien/Politik** und **Partnern/Beteiligten**: Wirkt er durchgehend sympathisch und hält jede Aussage auch isoliert zitiert stand?

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
            title: 'Versandfertige Medienantwort & Pre-Flight-Check',
            text: `TASK: VERSANDFERTIGE MEDIENANTWORT & PRE-FLIGHT QUALITY GATE
Erstelle auf Basis der festgelegten Linie das versandfertige Kommunikations-Asset:

1. **Taktischer Hebel & Mehrperspektiven-Check (vorab, max. 3 Sätze):**
   - Begründe knapp den gewählten strategischen Ansatz, warum er vor **Betroffenen/Laien**, **kritischer Redaktion/Politik** und **Partnern/Beteiligten** überzeugt, und was bewusst weggelassen wird.

2. **Versandfertige Medienantwort (Hauptentwurf + bei Bedarf kompakte/taktische Variante 2):**
   - **Nahbar, menschlich, sympathisch & ohne Vorwissen verständlich (Anti-Technokratie):** Schreib aktiv, warmherzig, zugänglich und komplett frei von Technokratie, Behörden-, Planer- oder Juristendeutsch – so anschaulich, dass auch Menschen ohne jedes Vorwissen den Sinn und die Zusammenhänge beim ersten Lesen mühelos verstehen. Verzichte strikt auf belehrende oder defensive Formulierungen, Zirkelschlüsse oder Banalitäten.
   - **Prämissen-Souveränität & Positives Nutzen-Framing:** Übernimm niemals geladene Begriffe oder Negativ-Frames der Anfrage (auch nicht verneinend), sondern führe die Antwort über unser eigenes, positives Qualitäts- und Nutzen-Narrativ.
   - **Rollen-Präzision in Alltagssprache & Kalibrierter Ausstieg (Leak-fest):** Trenne eigene Verantwortung und Zuständigkeiten Dritter in der Sache präzise, aber natürlich formuliert. Schütze offene Entscheide, nenne keine volatilen Langfrist-Zahlen und formuliere allfällige Angebote zur Nachlieferung konditional statt als unbedingte Verpflichtung.

3. **Pre-Flight Quality Gate (1-Zeilen-Selbsttest):**
   - Bestätige kurz: *1. Nahbar, menschlich & sympathisch? 2. Ohne Vorwissen sofort verständlich (null Technokratie)? 3. Frei von fremden Negativ-Frames? 4. Mehrperspektiven-fest (Laien, Medien, Partner)? 5. Rollen, Vorbehalte & Ausstieg sauber?* (Etwaige Schwächen vor der Ausgabe direkt im Entwurf oben korrigieren).`
        },
        'C-MEDIA-CHECK': {
            id: 'C-MEDIA-CHECK',
            title: 'Medienantwort-Check (Forensische Challenge & 2 Varianten)',
            text: `TASK: DIAGNOSTISCHE DEKONSTRUKTION, MEDIEN-RECHERCHE & MEHRPERSPEKTIVEN-ANALYSE
Analysiere Ausgangslage, mediale Berichterstattung und Vorlage mit strategischem Scharfblick:
1. **Medien-Radar (M365 & Web), Subtext & Triage:** Suche aktiv in M365 (inkl. «#KOM-ANKER») und via Websuche nach **bisheriger und aktueller medialer Berichterstattung** sowie früheren Stellungnahmen zum Thema. Was ist vor diesem Hintergrund das tatsächliche Motiv der Anfrage, steht der Entwurf im Einklang mit bereits publizierten Aussagen, und ist der Verzicht auf weitere interne Detailabklärungen verhältnismässig?
2. **Mehrperspektiven-Stresstest (3 Blickwinkel):** Wie wirkt der Entwurf auf (a) **Betroffene & Laien ohne Vorwissen** (nahbar, menschlich, sympathisch und sofort einleuchtend vs. technokratisch, kühl oder belehrend?), (b) **kritische Redaktionen & Politik** (Prämissen-Falle, Nachhak-Risiko, unfreiwillige Komik?) und (c) **Partner, Behörden & Beteiligte** (Zuständigkeiten, Solidarität und Vorbehalte gewahrt?)?

TASK: SCHONUNGSLOSE CHALLENGE DES ENTWURFS (PRE-FLIGHT-STRESSTEST)
Prüfe den vorliegenden Entwurf kompromisslos gegen diese vier Kriterien:
- **Nahbare Menschlichkeit & Laien-Verständlichkeit vs. Technokratie:** Wo klingt der Text nach Behörden-, Planer- oder Juristendeutsch, distanziert, passiv, herablassend, zirkulär oder banal – statt den Sachverhalt für Menschen ohne Vorwissen sympathisch, warmherzig und sofort greifbar zu erklären?
- **Prämissen- & Negativ-Framing-Falle:** Validiert der Text unabsichtlich das Framing der Kritik, indem er geladene Reizwörter oder Vorwürfe wiederholt bzw. verneint, statt ein eigenes positives Qualitäts- und Nutzen-Narrativ zu setzen?
- **Rollen-Klarheit & Leak-Festigkeit:** Nutzt der Entwurf angreifbare Ausreden oder vermischt er eigene und fremde Zuständigkeiten bzw. Entscheidungsebenen? Hält jeder Satz einer wörtlichen Publikation stand?
- **Verpflichtungs- & Ausstiegs-Kalibrierung:** Fehlen Vorbehalte bei noch offenen Entscheiden, stehen dort ungesicherte Zahlen oder bindet uns ein unbedingtes Nachlieferungs-Versprechen unnötig?

TASK: TAKTISCHE ABWÄGUNG & 2 OPTIMIERTE TEXTVARIANTEN
1. **Sorgfältige Abwägung der Stellschrauben:** Zeige präzise auf, durch welche inhaltlichen und sprachlichen Drehungen der Entwurf ohne zusätzlichen Abklärungsaufwand nahbar, sympathisch, laientauglich und unangreifbar wird.
2. **Zwei versandfertige Textvarianten:**
   - **Variante 1 – Nahbar, menschlich, sympathisch & narrativstark (Empfehlung):** Komplett frei von Technokratie, für Laien ohne Vorwissen sofort einleuchtend, löst fremde Prämissen positiv auf und kalibriert Vorbehalte/Ausstieg souverän.
   - **Variante 2 – Nahe am ursprünglichen Entwurf, aber entschärft (Minimal-invasiv):** Behält Struktur und Kürze des Ausgangsentwurfs bei, macht den Ton aber menschlich-zugänglich und eliminiert alle Technokratie-, Framing- und Festlegungsfallen.`
        },
        'O-REPLY': {
            id: 'O-REPLY',
            title: 'Antwortentwurf & Taktische Umsetzung (E-Mail / Textblock)',
            text: `TASK: TAKTISCHE EMPFEHLUNG & VERSANDFERTIGER E-MAIL-ENTWURF
Liefere das Ergebnis passend zum Auftrag (interne Linie, Direktantwort, gestufter Zwischenbescheid oder Textblock für Dritte):

1. **Interne Einordnung & Mehrperspektiven-Spielzug (Ich-Form, 2–3 Sätze, leak-fest):**
   - Gib eine scharfsinnige Empfehlung («Aus meiner Sicht…»): Welches taktische Vorgehen löst die Situation aus Sicht von **Betroffenen/Laien**, **Medien/Öffentlichkeit** und **Partnern/Beteiligten** am klügsten – und was lassen wir bewusst weg?

2. **Versandfertiger Textblock / E-Mail-Entwurf (bei taktischen Weichenstellungen gerne mit Kurz-Variante):**
   - **Nahbar, menschlich, sympathisch & frei von Technokratie (Laien-Test):** Schreib aktiv, warmherzig, verbindlich und auf Augenhöhe – so klar und frei von Fach-, Behörden- oder Juristendeutsch, dass auch Menschen ohne Vorwissen das Anliegen sofort verstehen. Verzichte strikt auf bürokratische Schärfe, belehrende Partikeln und fremde Negativ-Frames.
   - **Rollen-Sauberkeit in Alltagssprache & Kalibrierter Ausstieg:** Trenne Zuständigkeiten und Entscheidungsvorbehalte in der Sache präzise, aber natürlich und partnerschaftlich formuliert; halte allfällige Folgekommunikation konditional statt als unbedingte Zusage.`
        },
        'O-QA': {
            id: 'O-QA',
            title: 'Q+A Tabelle',
            text: `TASK: KRITISCHES Q+A (MEHRPERSPEKTIVISCH, SYMPATHISCH & ZITIERFÄHIG)
Erstelle ein kompaktes Q+A mit den 4–8 wichtigsten kritischen Fragen aus drei realistischen Perspektiven (**Betroffene/Laien im Alltag**, **kritische Medien/Politik**, **Partner/Behörden** – Anzahl proportional zum Thema). *Qualitätsregeln für jede Antwort:* (a) **Nahbar, menschlich, sympathisch & ohne Vorwissen verständlich (Outside-in):** Natürliche, greifbare Alltagssprache ohne Technokratie oder internen Jargon; eigenes positives Nutzen-Narrativ zuerst, niemals Vorwürfe wiederholen; (b) **Souveräne Abgrenzung & Vorbehalt:** Fremde Zuständigkeiten fair benennen und offene künftige Entscheide durch nachvollziehbare Alltagslogik schützen; (c) **Isoliert zitierbar**:
| Kritische Frage (Perspektive) | Empfohlene Antwort (nahbar, sympathisch, laientauglich & zitierbar) | Begründung der Linie / Schutzgrenze |
|-------------------------------|---------------------------------------------------------------------|-------------------------------------|`
        },
        'O-INTERVIEW': {
            id: 'O-INTERVIEW',
            title: 'Interview- & Medienbriefing',
            text: `TASK: INTERVIEW- UND MEDIENBRIEFING
Erstelle das kompakte, sofort einsatzbereite Interview-Briefing in exakt folgender Struktur:
1. **Ziel, Rahmen & Rolle:** Ziel des Gesprächs, unsere Rolle (inkl. klarer Abgrenzung bei fremder Federführung) und nahbar-sympathische, menschliche Tonalität (2–3 Sätze).
2. **Eigenes Narrativ & Schutzgrenzen:** [Tragender Leitsatz aus eigener Perspektive + klare Grenze zu offenen Verfahren, Vertraulichkeit und Vorbehalten]
3. **Drei bis vier zitierfähige Kernbotschaften (Outside-in & laientauglich):** [Knapp, sympathisch, menschlich und für Menschen ohne Vorwissen sofort einleuchtend – komplett frei von Technokratie]
4. **Mehrperspektivischer Fragenkatalog mit Antwortempfehlungen:** (Fragen aus Sicht von Redaktion, Betroffenen/Alltag und Politik; Antworten in natürlicher, sympathischer gesprochener Sprache mit greifbaren Beispielen ohne Fach-/Behörden-Jargon; eigenes Narrativ statt Wiederholung/Verneinung von Vorwürfen)
| Kritische Frage | Taktischer Fokus (was setzen / was weglassen) | Souveräner Antwortvorschlag (sympathisch, laientauglich & zitierfähig) |`
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
- **Nahbar, menschlich, sympathisch & ohne Vorwissen verständlich:** Fesselnder Einstieg (Lead), konkrete Beispiele und eine warme, anschauliche, lebendige Sprache komplett frei von Technokratie, Eigenlob-Floskeln oder KI-Phrasen – sodass auch Lesende ohne Vorwissen sofort folgen können.
- **Sauberer Faktenstatus:** Gesicherte Tatsachen klar von offenen Prüfoptionen/Planungsannahmen trennen; keine unbelegten Versprechen.
- **Konsistente Einordnung:** Unseren konkreten Beitrag für Menschen und Alltag organisch sichtbar machen und die Rollen externer Partner fair wahren.`
        },
        'O-POST': {
            id: 'O-POST',
            title: 'Social Media Post (Challenge / Entwurf & Visual-Briefing)',
            compile: () => {
                return `ZIELKANAL / ABSENDER: {KANAL_PERSON}

TASK: KURZ-FEEDBACK (BEI ENTWURFS-CHALLENGE) & POSITIONIERUNGS-LINIE
1. **Einordnung an Anfragende (Ich-Form, 2–3 Sätze):**
   - *Falls im Thread bereits ein Post-Entwurf vorliegt:* Benenne kollegial («Aus meiner Sicht…»), was am Entwurf trägt und welche 2–3 Punkte wir schärfen sollten (z.B. Einstieg konkreter statt Standard-Floskel, internen Fachjargon in greifbaren Alltagsnutzen übersetzen, Rollen von Partnern/Beteiligten sauber einordnen, offene Entscheide nicht als beschlossen darstellen).
   - *Falls ein neuer Post entsteht:* Begründe kurz den gewählten Aufhänger (Hook), das eigene positive Nutzen-Narrativ und was aus dem Rohmaterial bewusst weggelassen wird (Vertraulichkeit, ungesicherte Zahlen/Termine).
2. **Stimm- & Kanal-Kalibrierung:** Passe Perspektive, Flughöhe und Tonfall organisch an die Absender-Rolle bzw. den Kanal an – durchgehend nahbar, menschlich, sympathisch und frei von Technokratie (egal ob strategische Führungsperspektive, Facheinblick aus Projekt/Betrieb oder visuelles Community-Storytelling).

TASK: PUBLIKATIONSREIFE POST-VARIANTEN & VISUAL-BRIEFING
Erstelle zwei direkt verwendbare Textfassungen sowie den Bild-/Asset-Hinweis:

### 1. HAUPTENTWURF (SUBSTANZ & STORYTELLING)
- **Starker Hook (Zeile 1–2):** Konkrete Beobachtung, überraschende Perspektive oder greifbarer Nutzen – strikt ohne hohle LinkedIn-Floskeln («Ich freue mich sehr…», «Ein weiterer Meilenstein…», Raketen-Emojis).
- **Körper (Nahbar, menschlich, sympathisch & ohne Vorwissen verständlich):** Konkreter Mehrwert für Menschen und Alltag zuerst; komplexe Zusammenhänge ohne Fachjargon erklären; Faktenstatus und offene Vorbehalte sauber wahren; beteiligte Partner und Teams fair würdigen.
- **Abschluss & Hashtags:** Sympathischer Schlusssatz oder echte, einladende Frage an die Community + max. 3–5 passende Hashtags.

### 2. ALTERNATIVE (POINTIERTE KURZFASSUNG)
- Kompakter, schnell scannbarer Post mit alternativem Einstieg (ideal für Mobile-Feeds oder Carousel-/Reel-Begleittext).

### 3. BILD- & ASSET-EMPFEHLUNG
- Welches konkrete, authentische Bild-/Videomotiv (z.B. echte Szene mit Menschen vor Ort, Blick hinter die Kulissen, Vorher/Nachher-Vergleich statt steriler Symbolbilder) die Botschaft am besten trägt.`;
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
        // 1. MEDIENANFRAGE (2 TURNS - FAST DIAGNOSTIC + STRATEGY -> DRAFT)
        {
            id: 'recipe-medienanfrage',
            name: 'Medienanfrage',
            family: 'respond',
            turns: [
                {
                    title: 'DIAGNOSE, RECHERCHE & STRATEGIE-LINIE',
                    role: 'Du bist ein erstklassiger Kommunikationsstratege und Mediensprecher.',
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { scope: 'media' } }, { chunkId: 'S-FULL', params: { includeFormatAnalysis: true } }]
                },
                {
                    title: 'MEDIENANTWORT & PRE-FLIGHT-CHECK',
                    role: 'Du bist ein erstklassiger Mediensprecher.',
                    chunks: ['O-MEDIA']
                }
            ],
            forks: ['C-MEDIA-CHECK', 'O-QA', 'O-INTERVIEW', 'O-THEMENPLANUNG']
        },

        // 2. INTERVIEW BEANTWORTEN (2 TURNS)
        {
            id: 'recipe-interview',
            name: 'Interview beantworten',
            family: 'respond',
            turns: [
                {
                    title: 'DIAGNOSE, RECHERCHE & INTERVIEW-STRATEGIE',
                    role: 'Du bist ein erfahrener Mediensprecher und Interview-Coach.',
                    chunks: ['I-MEDIA', { chunkId: 'R-FULL', params: { scope: 'media', focus: 'bisherige und aktuelle mediale Berichterstattung, bisherige Positionierungen, Journalistin/Journalist und Medium' } }, 'S-FULL']
                },
                {
                    title: 'INTERVIEW-BRIEFING & ANTWORTEN',
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
                    title: 'LAGEBILD & TAKTIK-CHECK',
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

        // 4. EMAIL & BERATUNG (2 TURNS - DEEP TACTICAL SPARRING & READY-TO-SEND REPLY)
        {
            id: 'recipe-email',
            name: 'Email & Beratung',
            family: 'respond',
            turns: [
                {
                    title: 'LAGEBILD, SUBTEXT & TAKTISCHE WEICHENSTELLUNG',
                    role: 'Du bist ein brillanter strategischer und taktischer C-Level Sparringpartner und Kommunikationsberater.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-REQUEST', 'S-FULL']
                },
                {
                    title: 'TAKTISCHE EMPFEHLUNG & ANTWORTENTWURF',
                    role: 'Du bist ein versierter Chef-Kommunikator und Verhandlungsstratege.',
                    chunks: ['O-REPLY']
                }
            ],
            forks: ['O-STRATEGY', 'O-ACTIONS', 'O-QA']
        },

        // 5. MEETING ANALYSIEREN (2 TURNS)
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

        // 6. TEXTPRÜFUNG & FREIGABE (2 TURNS)
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

        // 7. THEMENANALYSE & PLANUNG (2 TURNS - 360° ISSUE TRIAGE, DECISION & THEMENBOARD)
        {
            id: 'recipe-themenplanung',
            name: 'Themenanalyse & Planung',
            family: 'plan',
            turns: [
                {
                    title: 'LAGEBILD & 360°-MEHRPERSPEKTIVEN-CHECK',
                    role: 'Du bist ein Senior Issue Manager und Redaktionsleiter der Kommunikationsplanung.',
                    chunks: ['I-MAIL', { chunkId: 'R-FULL', params: { scope: 'media' } }, 'C-PERSPECTIVE', 'T-TLDR']
                },
                {
                    title: 'ENTSCHEID, THEMENPLANUNG & MASSNAHMEN',
                    role: 'Du bist ein Senior Issue Manager und Redaktionsleiter der Kommunikationsplanung.',
                    chunks: [{ chunkId: 'S-DECISION', params: { mode: 'issue' } }, 'O-THEMENPLANUNG', 'O-ACTIONS']
                }
            ],
            forks: ['O-STRATEGY', 'O-REPLY', 'O-QA']
        },

        // 12. ARTIKEL SCHREIBEN (2 TURNS - RESEARCH & OUTLINE -> FULL DRAFT)
        {
            id: 'recipe-artikel',
            name: 'Artikel schreiben',
            family: 'create',
            turns: [
                {
                    title: 'RECHERCHE, THESEN-CHECK & ARTIKEL-OUTLINE',
                    role: 'Du bist ein leitender Magazin-Redakteur, Dramaturg und Co-Autor.',
                    chunks: ['I-MAIL', 'R-FULL', 'C-THESIS', 'O-ARTICLE-OUTLINE']
                },
                {
                    title: 'VOLLSTÄNDIGER ARTIKELENTWURF',
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

        // 17. PRÄSENTATION & STORYBOARD (2 TURNS - DIAGNOSE & STORYLINE -> STORYBOARD)
        {
            id: 'recipe-praesentation',
            name: 'Präsentation & Storyboard',
            family: 'review',
            turns: [
                {
                    title: 'DECK-DIAGNOSE, RECHERCHE & STORYLINE-ARCHITEKTUR',
                    role: 'Du bist ein strategischer Executive-Präsentationsberater und Storyline-Architekt für anspruchsvolle Entscheidungs- und Stakeholder-Gremien.',
                    chunks: ['I-PPT', 'R-FULL', 'S-PPT-STRATEGY']
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
                        { chunkId: 'R-FULL', params: { focus: 'bisherige und aktuelle mediale Berichterstattung, Hintergrundkontext, bisherige Positionierungen, Partnerrollen, Faktenstand und verfügbare Bild-/Video-Assets' } },
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
