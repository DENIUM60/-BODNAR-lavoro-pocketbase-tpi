# Progetto Monitoraggio Sismico Globale

Questo progetto è un'applicazione web interattiva sviluppata con la libreria Leaflet.js, progettata per visualizzare in tempo reale i dati sui terremoti.

## Funzionalità Principali

* **Visualizzazione Dinamica:** Mappatura dei terremoti globali con cerchi stilizzati (marker) la cui dimensione e colore sono proporzionali alla magnitudo.
* **Gestione Temi:** Supporto per la modalità Chiaro (Light mode) e Scuro (Dark mode), con cambio dinamico dello sfondo (Tile Layer) e ricalibrazione del colore dei confini nazionali per garantire la leggibilità.
* **Filtri Interattivi:** Possibilità di filtrare gli eventi sismici per periodo (ultime 24 ore, 7 giorni, 30 giorni) e per magnitudo minima.
* **Confini Nazionali:** Visualizzazione del layer GeoJSON dei confini dei Paesi per una migliore contestualizzazione geografica.
* **Aggiornamento in Tempo Reale:** I dati vengono recuperati e aggiornati automaticamente ogni 5 minuti.

## Struttura del Progetto

Il progetto è composto da tre file principali:

### index.html
Contiene il file hmtl per interfaccia del sito.

### src/style.css
Definisce la configurazione dei temi (Chiaro/Scuro) e gestisce lo stile dei pannelli di controllo Leaflet personalizzati e della tabella dei dati.

### src/main.js
Il file JavaScript principale che gestisce la logica della mappa.

## Layer e Controlli

L'applicazione gestisce tre layer principali e tre controlli UI personalizzati:

* **Layer Base**  Sfondo della mappa (OpenStreetMap / CartoDB Dark). 
* **Layer Dati** Gruppo dinamico contenente i cerchi che rappresentano i terremoti. 
* **Layer Confini** Layer GeoJSON dei confini globali, utilizzato per migliorare la leggibilità. 

Mentre l'interfaccia è strutturata così:

* **InfoControl** In alto a sinistra sono presenti i filtri di Magnitudo/Periodo e la tabella dei dati. 
* **ThemeControl**  In alto a destra ci sta il bottone per il toggle del tema Chiaro/Scuro. 
* **LegendControl** In basso a sinistra viene siegata, tramite la legenda, la relazione tra colore/dimensione dei marker e magnitudo. 
