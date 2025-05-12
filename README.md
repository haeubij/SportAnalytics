# SportAnalytics 
Projektzusammenfassung: Webbasierte Videoanalyse-Plattform für Sportarten

Inhalt
1.	Einführung	2
2.	Ziele des Projektes	2
3.	IST-Situation & Problemstellung	3
4.	Kernfunktionen & Features	4
5.	Technischer Aufbau & Architektur	5
6.	Umsetzung und Entwicklungsphase	5































1.	Einführung
In der heutigen Sportwelt spielt die Videoanalyse eine entscheidende Rolle, um Leistungen zu verbessern, taktische Entscheidungen zu optimieren und Spielerbewegungen zu studieren. Während professionelle Teams teure und spezialisierte Softwarelösungen nutzen, fehlt es Amateursportlern, Trainern und Sportbegeisterten an einer kostenlosen, einfach bedienbaren und sportartenübergreifenden Alternative.
Unser Projekt zielt darauf ab, eine webbasierte Plattform zu entwickeln, die es Nutzern ermöglicht, Videos hochzuladen, zu analysieren, zu markieren und zu teilen. Die Lösung soll auf Angular für das Frontend und C# (.NET) für das Backend basieren und durch Cloud-Speicherung die sichere Verwaltung von Videodaten ermöglichen.
2.	 Ziele des Projektes
Die Entwicklung einer kostenlosen, intuitiven und vielseitigen Web-App, die es Sportlern und Trainern ermöglicht, Videos hochzuladen, zu analysieren und zu teilen, um aus den eigenen oder anderen Erfahrungen zu lernen.
Hauptziele:
Kostenlose & zugängliche Plattform für alle Sportarten
Einfache Videoanalyse-Tools (Markierungen, Laufwege, Notizen)
Upload & Kategorisierung von Videos in verschiedene Sportarten
Download-Funktion für bearbeitete Videos
Community-Feature: Videos mit anderen teilen & lernen
Skalierbare Architektur, um künftige Erweiterungen zu ermöglichen



3.	IST-Situation & Problemstellung
Aktuelle Herausforderungen:
Professionelle Videoanalyse-Software ist teuer (z. B. Hudl, Dartfish)
Viele Lösungen sind auf bestimmte Sportarten begrenzt
Fehlende kostenlose Alternativen mit vergleichbaren Analysefunktionen
Komplexe Bedienung bestehender Softwarelösungen
Kein offener Wissensaustausch über Sport-Videoanalysen

Marktpotential & Bedarf:
1 Milliarde Sportler weltweit, darunter Amateursportler, Trainer und Vereine
700.000+ Sportvereine in Europa, die von einer kostenlosen Lösung profitieren könnten
Sporttechnologie-Markt wächst stark (30+ Milliarden USD weltweit)
Millionen täglicher Sport-Videoaufrufe auf YouTube zeigen großes Interesse












4.	Kernfunktionen & Features
Unsere Web-App wird folgende Funktionen beinhalten:
Videoverwaltung & Upload:
Nutzer können Videos hochladen und in Kategorien organisieren
Möglichkeit, Videos nach Sportart, Team oder Spieler zu filtern
Videoanalyse & Bearbeitung:
Markierungen & Kreise zur Hervorhebung von Spielern
Laufwege einzeichnen für Taktikanalysen
Zeitleiste mit Kommentarfunktion für detaillierte Analysen
Pause, Zeitlupe & Video-Steuerung wie bei YouTube
Community & Wissensaustausch:
Öffentliche & private Videos: Nutzer können Videos freigeben oder privat speichern
Bewertung & Kommentare zu geteilten Videos
Möglichkeit zur Kooperation & gemeinsamen Analyse von Videos
Speicherung & Export:
Download-Funktion für bearbeitete Videos
Export von Analysen als PDF oder Bild für Präsentationen
Speicherung in Azure oder AWS Cloud für Skalierbarkeit
Benutzerverwaltung & Login:
Registrierung & Login für personalisierte Inhalte
Profilverwaltung mit gespeicherten Videos & Analysen
Rollen- & Rechteverwaltung (Trainer, Spieler, Analysten)



5.	 Technischer Aufbau & Architektur

Technologie	
Beschreibung
Frontend	Angular für moderne, reaktionsschnelle UI


Backend	React


Datenbank	SQL Server oder PostgreSQL für Video- & User-Daten


Videoplayer	VideoJS oder HTML5 für erweiterbare Videosteuerung
Speicherung*	Azure Blob Storage oder AWS S3 für sichere Videoverwaltung



6.	Umsetzung und Entwicklungsphase
Phase 1: Initialisierung & Konzept (PoC)
Vergleich von Technologien (Angular vs. React, Azure vs. AWS)
Entwicklung eines Prototyps mit Grundfunktionen (Video-Upload, Wiedergabe)
Erfassung & Validierung der Anforderungen durch erste Tests
Phase 2: MVP-Entwicklung (Minimal Viable Product)
User-Login & Datenbank
Video-Upload & Kategorien
Basis-Analyse-Tools (Markierungen, Laufwege)
Community-Funktion (Teilen & Kommentieren von Videos)
Phase 3: Erweiterung & Optimierung
Erweiterte Analysefunktionen (Heatmaps, KI-gestützte Bewegungsanalyse)
Mobile Optimierung & App-Version (PWA)
API-Schnittstellen für Drittanbieter & Trainer-Apps

