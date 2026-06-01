# 📝 Fredriks Todo-Listor

Din personliga todo-app synkad med Telegram. Skapa och hantera listor direkt från Telegram eller via webappen.

## 📱 Kom Igång

### Via Telegram
Skriv till mig (Bosse) direkt:

```
handla mjölk bröd morot      → Lägger till i Handla-listan
jobb ring kundservice kl 10  → Lägger till i Jobb-listan
idag hämta pojkarna kl 16    → Lägger till i Dagsplaneringen
```

### Via Webbappen
Öppna: [fredrikberg112.github.io/todo-app](https://fredrikberg112.github.io/todo-app/)

## 📋 Listor

### 🛒 Handla
Inköpslista för dagliga varor.

### 💼 Jobb  
Uppgifter och påminnelser för jobbet på ICA Nära.

### 📅 Dagsplanering
Dagliga uppgifter som hämtningar, aktiviteter, etc.

## ✨ Funktioner

- ✅ **Smart igenkänning**: Appen gissar rätt lista baserat på vad du skriver
- 🔄 **Synk**: Sparas automatiskt
- 📱 **Mobilvänlig**: Fungerar perfekt på mobilen
- 🎯 **Sammanfattning**: Dagens översikt med statistik

## 🛠️ Utveckling

```bash
# Kör lokalt
cd todo-app
python -m http.server 8080

# Öppna http://localhost:8080
```

## 📁 Struktur

```
todo-app/
├── index.html          # Huvudfil
├── app.js              # App-logik
├── package.json        # NPM config
├── telegram-bridge.js  # Telegram-integration
└── README.md           # Dokumentation
```

---

Skapat av Fredrik Berg med hjälp av Bosse 🤖
