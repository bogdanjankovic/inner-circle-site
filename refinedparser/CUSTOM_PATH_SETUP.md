# Custom Path Setup - A:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\replays

## ✅ Podešavanje Završeno!

Aplikacija sada automatski otvara tvoju custom putanju kada klikneš "Browse...":

```
A:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\replays
```

## 🚀 Korišćenje

1. **Pokreni aplikaciju**: `java -jar target/refinedparser-1.0-SNAPSHOT.jar`
2. **Klikni "Browse..."** - automatski otvara tvoj folder
3. **Izaberi .dem fajl** - iz tvoje replay kolekcije
4. **Parsiraj** - dobijaš OpenDota analizu

## 📁 Šta ako putanja ne postoji?

Ako putanja `A:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\replays` ne postoji, aplikacija će automatski fallback-ovati na:
- User Home folder (tvoj Documents/Desktop)

## 🔧 Moguće Modifikacije

Ako želiš da promeniš putanju, izmeni ovu liniju u `ReplayFileParserGUI.java`:

```java
String defaultPath = "A:\\SteamLibrary\\steamapps\\common\\dota 2 beta\\game\\dota\\replays";
```

## 🎮 Puno Uživanja!

Sada možeš lako pristupiti svojim replay fajlovima i dobiti profesionalnu OpenDota analizu za sve mečeve!
