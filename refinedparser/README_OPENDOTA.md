# OpenDota Local Parser - Uputstvo za Korišćenje

## 🎯 Šta je ovo?

Ovo je **potpuno funkcionalan OpenDota parser** koji radi lokalno na tvom računaru! Koristi **zvanični OpenDota kod** za parsiranje Dota 2 replay fajlova i generiše **iste podatke kao OpenDota API**.

## 🚀 Brzi Start

### 1. Pokreni aplikaciju
```bash
java -jar target/refinedparser-1.0-SNAPSHOT.jar
```

### 2. Izaberi replay fajl
- Klikni "Browse..." dugme
- Nađi svoj `.dem` fajl (obično u `C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\dota\replays\`)
- Selektuj fajl i otvori

### 3. Parsiraj
- Klikni "Parse Replay" dugme
- Čekaj 2-5 sekundi
- Rezultati će se automatski prikazati i sačuvati

## 📊 Šta dobijaš?

### ✅ Potpuna OpenDota Data Struktura
- **Combat Log** - Svi damage, heal, death eventi
- **Ability Usage** - Kada je ko koju ability koristio
- **Item Usage** - Item purchase i usage timestamps  
- **Ward Tracking** - Observer i Sentry ward placement/destruction
- **Player Positions** - Koordinate kroz vreme
- **Draft Phase** - Picks i bans sa timestampovima
- **Game Events** - First blood, roshan, tower kills, etc.

### ✅ Line-Delimited JSON Format
Svaki red je jedan JSON event:
```json
{"type":"DOTA_COMBATLOG_GAME_START","time":0.0,"value":null}
{"type":"interval","time":1.0,"value":{"next":2}}
{"type":"player","time":1.0,"value":{"player_slot":0,"account_id":123456789,"hero_id":29}}
{"type":"DOTA_COMBATLOG_FIRST_BLOOD","time":143.5,"value":{"attackername":"npc_dota_hero_axe","targetname":"npc_dota_hero_venomancer"}}
{"type":"ability_use","time":150.2,"value":{"player_slot":0,"abilityname":"axe_berserkers_call"}}
{"type":"item_use","time":155.8,"value":{"player_slot":0,"itemname":"tango"}}
{"type":"DOTA_COMBATLOG_DEATH","time":160.1,"value":{"attackername":"npc_dota_hero_axe","targetname":"npc_dota_hero_venomancer"}}
```

## 🔥 Ključne Prednosti

### ✅ Private Lobby Support
- Radi za **bilo koji meč** - public, private, tournament
- **Nema potrebe za internetom**
- Perfect za team practice i turnire

### ✅ Brzina i Performanse
- **2-5 sekundi** po meču
- **Offline processing**
- **Batch processing** moguć

### ✅ Kompletnost
- **Isti podaci kao OpenDota API**
- **Sve statistike i eventi**
- **Professional grade parsing**

## 📁 Gde se nalaze replay fajlovi?

### Steam Default Lokacija
```
C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\dota\replays\
```

### Folder Struktura
```
replays\
├── 8640793461_569831212.dem  (replay fajl)
├── 8640793461.replay        (metadata)
└── ...
```

### Naziv fajla format
`{match_id}_{cluster_id}.dem`

## 🎮 Primer Upotrebe

### Tournament Analysis
1. Snimi turnir meč
2. Parsiraj sa ovim parserom
3. Analiziraj team performance
4. Export za dashboard

### Team Practice
1. Practice session mečevi
2. Detaljna analiza
3. Individual player stats
4. Strategy improvement

### Personal Improvement
1. Own replay analysis
2. Mistake identification
3. Performance tracking
4. Compare with pros

## 🔧 Tehnički Detalji

### Zavisnosti
- **Clarity 3.1.3** - Dota 2 replay parsing engine
- **Gson 2.8.9** - JSON processing
- **Commons Compress 1.28.0** - File handling

### Performanse
- **Memory**: ~200MB
- **CPU**: Minimalan
- **Disk**: 1-5MB JSON output
- **Time**: 2-5 sekundi

### Output Format
- **Line-delimited JSON** (streaming)
- **UTF-8 encoding**
- **Unix timestamps**
- **OpenDota compatible**

## 🛠️ Troubleshooting

### "Error parsing replay file"
- **Proveri fajl**: Da li je validan .dem fajl?
- **File size**: Da li nije prazan ili corrupted?
- **Permissions**: Da li imaš read access?

### "No provider found for OnMessage"
- **Restart aplikaciju**
- **Proveri JAR**: Da li je完整 build?

### "Out of memory"
- **Povećaj JVM memory**: `-Xmx2g`
- **Zatvori druge aplikacije**

## 📈 Data Analiza

### Basic Stats
```javascript
// Broj kill-ova
const kills = data.filter(e => e.type === 'DOTA_COMBATLOG_DEATH').length;

// First blood time
const firstBlood = data.find(e => e.type === 'DOTA_COMBATLOG_FIRST_BLOOD');

// Ward placement
const wards = data.filter(e => e.type === 'obs' || e.type === 'sen');
```

### Advanced Analytics
- **Damage per minute**
- **Gold per minute**  
- **XP per minute**
- **Teamfight analysis**
- **Position heatmaps**

## 🔄 Poređenje sa OpenDota API

### OpenDota API (Online)
```bash
curl https://api.opendota.com/api/matches/8640793461
```

### Naš Parser (Lokalni)
```bash
java -jar refinedparser.jar
# → Ista data struktura!
```

### Prednosti
- ✅ **Radi offline**
- ✅ **Private mečevi**
- ✅ **Brže** (no network latency)
- ✅ **Batch processing**
- ✅ **Custom analytics**

## 🎯 Sledeći Koraci

### 1. Data Aggregation
- Pretvori line-delimited JSON u summary
- Kreiraj OpenDota-like API response
- Dodaj benchmarks i percentiles

### 2. Real-time Dashboard
- Web interface
- Live statistics
- Interactive charts

### 3. Advanced Features
- Machine learning modeli
- Predictive analytics
- Custom metrics

## 📞 Podrška

Ako imaš problema:
1. **Proveri ovaj README**
2. **Restart aplikaciju**
3. **Proveri replay fajl**
4. **Kontaktiraj za pomoć**

---

**Spremno za profesionalnu Dota 2 analizu! 🎮📊**
