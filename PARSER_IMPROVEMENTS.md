# Dota 2 Parser - Poboljšanja

## 🔧 Novo u ovom update-u:

### 1. **Item Purchase Timeline**
- **Novo polje**: `itemPurchases` za svakog igrača
- **Format**: `[{ "item": "PhaseBoots", "time": 325.5 }, ...]`
- **Koristi**: `dota_item_purchased` event sa tačnim vremenom kupovine

### 2. **Poboljšani Ward Tracking**
- **Pravilno vreme**: Wardovi sada imaju tačno vreme postavljanja
- **Pozicije**: Dodat fallback na `m_vecOrigin` za tačnije koordinate
- **Handle tracking**: Praćenje ward entiteta za bolju identifikaciju

### 3. **Ispravke bugova**
- **Duplirana polja**: Uklonjen duplikat `netWorth`
- **Bolje error handling**: Robustniji parsing za edge cases

### 4. **Struktura novog JSON output-a**

```json
{
  "players": [
    {
      // ... sadašnja polja ...
      "itemPurchases": [
        { "item": "Tango", "time": 0.0 },
        { "item": "PhaseBoots", "time": 325.5 },
        { "item": "MagicWand", "time": 892.3 }
      ],
      // ... ostala polja ...
    }
  ],
  "wards": [
    {
      "type": "Observer",
      "x": 126,
      "y": 128,
      "owner": 13123589,
      "time": 245.7  // sada tačno vreme!
    }
  ]
}
```

## 🚀 Korišćenje

1. **Kompajliraj**: `mvn clean package`
2. **Pokreni**: `java -jar target/dota-parser-1.0-SNAPSHOT.jar <demofile>`
3. **Output**: JSON sa svim poboljšanjima

## 📊 Dodatne statistike koje se prate

- **Item purchase times** - Tačno vreme svake kupovine
- **Ward placement times** - Precizno kad su wardovi postavljeni
- **Neutral tokens** - Praćenje token pickup-a
- **Camp stacks** - Broj stackova po igraču
- **Tormentor kills** - Ubistva tormentora

## 🔄 Sledeći koraci

1. **Testirati** na stvarnim DEM fajlovima
2. **Integracija** sa admin panelom
3. **Supabase storage** za parsed podatke
4. **Frontend vizualizacija** item timeline-a

## 🐛 Poznati problemi

- Facet informacije i dalje mogu biti "Unknown" (zahteva update hero facets JSON)
- Neki wardovi mogu imati [0,0] pozicije ako su u nekim specijalnim slučajevima
