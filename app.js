(function () {
  "use strict";

  var STORAGE_KEY = "caricaDelGiorno.v1";

  var btn = document.getElementById("btn");
  var btnLabel = document.getElementById("btnLabel");
  var hint = document.getElementById("hint");
  var card = document.getElementById("card");
  var fraseEl = document.getElementById("frase");
  var numEl = document.getElementById("num");
  var dataEl = document.getElementById("data");
  var streakEl = document.getElementById("streak");
  var totalEl = document.getElementById("total");
  var countdownEl = document.getElementById("countdown");
  var burst = document.getElementById("burst");

  // ---------- utilità data (sempre in ora locale) ----------
  function pad(n) { return String(n).padStart(2, "0"); }

  function dateKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function dayOfYear(d) {
    var a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    var b = Date.UTC(d.getFullYear(), 0, 0);
    return Math.round((a - b) / 86400000); // 1..366
  }

  function yesterdayKey(d) {
    var y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    return dateKey(y);
  }

  // ---------- storage ----------
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { lastDate: null, streak: 0, total: 0 };
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();

  // ---------- frase del giorno ----------
  function fraseDi(d) {
    var idx = (dayOfYear(d) - 1) % FRASI.length;
    return { idx: idx, testo: FRASI[idx] };
  }

  // ---------- UI ----------
  function renderDate() {
    var s = new Date().toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long"
    });
    dataEl.textContent = s;
  }

  function renderStats() {
    var today = new Date();
    var streak = state.streak;
    // se ieri non hai cliccato e oggi nemmeno, la serie è già spezzata
    if (state.lastDate && state.lastDate !== dateKey(today) && state.lastDate !== yesterdayKey(today)) {
      streak = 0;
    }
    streakEl.textContent = streak;
    totalEl.textContent = state.total;
  }

  function showPhrase(animate) {
    var f = fraseDi(new Date());
    var words = ("\u201C" + f.testo + "\u201D").split(" ");
    fraseEl.innerHTML = "";
    fraseEl.classList.toggle("anim", !!animate);
    words.forEach(function (w, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      s.style.setProperty("--i", i);
      fraseEl.appendChild(s);
      fraseEl.appendChild(document.createTextNode(" "));
    });
    numEl.textContent = "FRASE " + (f.idx + 1) + " / " + FRASI.length;
    card.hidden = false;
    card.classList.remove("show");
    if (animate) {
      void card.offsetWidth; // riavvia l'animazione
      card.classList.add("show");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function lockButton() {
    btn.disabled = true;
    btnLabel.textContent = "A DOMANI";
    hint.textContent = "Hai già preso la tua carica oggi. Torna domani!";
  }

  function unlockButton() {
    btn.disabled = false;
    btnLabel.textContent = "TOCCA";
    hint.textContent = "Una frase al giorno. Tocca per scoprire la tua.";
    card.hidden = true;
  }

  function explode() {
    var rect = btn.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var shock = document.createElement("span");
    shock.className = "shock";
    shock.style.left = cx + "px";
    shock.style.top = cy + "px";
    burst.appendChild(shock);
    setTimeout(function () { shock.remove(); }, 1400);
    document.body.classList.add("flash");
    setTimeout(function () { document.body.classList.remove("flash"); }, 700);
    var colors = ["#ff3d71", "#ff9f1c", "#00e5ff", "#8b5cf6", "#ffffff"];
    for (var i = 0; i < 36; i++) {
      var p = document.createElement("span");
      p.className = "particle";
      var angle = Math.random() * Math.PI * 2;
      var dist = 90 + Math.random() * 190;
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      burst.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 1300); })(p);
    }
  }

  // ---------- countdown fino a mezzanotte ----------
  function tick() {
    var now = new Date();
    var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    var diff = midnight - now;
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    countdownEl.textContent = pad(h) + ":" + pad(m) + ":" + pad(s);

    // nuovo giorno: sblocca il bottone
    if (btn.disabled && state.lastDate !== dateKey(now)) {
      unlockButton();
      renderDate();
      renderStats();
    }
  }

  // ---------- click ----------
  btn.addEventListener("click", function () {
    var now = new Date();
    var today = dateKey(now);
    if (state.lastDate === today) return; // già cliccato oggi

    state.streak = (state.lastDate === yesterdayKey(now)) ? state.streak + 1 : 1;
    state.total += 1;
    state.lastDate = today;
    save(state);

    explode();
    showPhrase(true);
    lockButton();
    renderStats();
  });

  // ---------- avvio ----------
  renderDate();
  renderStats();
  if (state.lastDate === dateKey(new Date())) {
    showPhrase(false);
    lockButton();
  }
  tick();
  setInterval(tick, 1000);
})();
