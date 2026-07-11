/* =========================================================
   STATE AND API
   ========================================================= */

const model = {
  data: null,
  screen: "home",
  selectedKid: null,
  editing: null,
  animateKid: null,
};
const app = document.getElementById("app");
function api(action, params = {}) {
  return new Promise((resolve, reject) => {
    const base = window.CHOICE_QUEST_CONFIG?.apiUrl;
    if (!base) return reject(new Error("Missing API URL in js/config.js"));
    const cb = `cq_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const q = new URLSearchParams({
      action,
      callback: cb,
      _: Date.now(),
      ...params,
    });
    const s = document.createElement("script");
    const done = () => {
      delete window[cb];
      s.remove();
    };
    window[cb] = (r) => {
      done();
      r?.ok === false ? reject(new Error(r.error)) : resolve(r.data);
    };
    s.onerror = () => {
      done();
      reject(new Error("Could not reach Choice Quest."));
    };
    s.src = `${base}?${q}`;
    document.head.appendChild(s);
  });
}
/* =========================================================
   STARTUP AND RENDERING
   ========================================================= */

async function load() {
  app.innerHTML = '<div class="loading">Loading the quest…</div>';
  try {
    model.data = await api("getState");
    model.selectedKid = model.selectedKid || model.data.kids?.[0]?.name;
    render();
  } catch (e) {
    app.innerHTML = `<div class="empty">${esc(e.message)}<br><button class="primary" onclick="load()">Try again</button></div>`;
  }
}
function render() {
  document
    .querySelectorAll(".bottom-nav button")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.screen === model.screen),
    );
  app.innerHTML =
    model.screen === "home"
      ? home()
      : model.screen === "store"
        ? store()
        : kidView();
  bind();
}
/* =========================================================
   HOME SCREEN
   ========================================================= */

function home() {
  const max = Number(model.data.settings?.gemsPerTicket || 10);
  const kids = (model.data.kids || [])
    .map(
      (k) =>
        `<section class="summary-card home-kid"><div class="kid-row"><div class="kid-name">${esc(k.name)}</div><div class="stat"><b>${k.tickets}</b><small>tickets</small></div><div class="stat"><b>${k.gems}</b><small>gems today</small></div></div>${homeGemStrip(k.gems, max)}</section>`,
    )
    .join("");
  const prizes = (model.data.prizes || [])
    .filter((p) => p.available)
    .slice(0, 3);
  return `<div class="section-head home-title"><h2>Today</h2></div>${kids}<section class="panel store-preview"><div class="section-head"><h2>Store preview</h2><button class="text-btn" data-go="store">See all</button></div><div class="preview-row">${prizes.length ? prizes.map(preview).join("") : '<div class="empty">No rewards yet.</div>'}</div></section>`;
}

function homeGemStrip(count, max) {
  const assets = CONSTANTS.TREASURE.gemAssets;
  return `<div class="home-gems">${Array.from({ length: max }, (_, i) => `<img src="${assets[i % assets.length]}" class="${i < count ? "earned" : "future"}" alt="">`).join("")}</div>`;
}
function preview(p) {
  return `<div class="preview-item">${photo(p)}<b>${esc(p.name)}</b><small>🎟️ ${p.cost}</small></div>`;
}
/* =========================================================
   STORE SCREEN
   ========================================================= */

function store() {
  const ps = model.data.prizes || [];
  return `<div class="section-head"><h2>Reward Store</h2></div><div class="store-grid">${ps.length ? ps.map((p) => `<article class="prize-card" data-edit="${attr(p.name)}">${photo(p)}<div class="prize-details"><h3>${esc(p.name)}${p.available ? "" : " · Hidden"}</h3><p>${esc(p.description || "")}</p><div class="prize-actions"><span class="price">🎟️ ${p.cost} tickets</span>${p.available ? `<button class="purchase-btn" data-purchase="${attr(p.name)}">Purchase</button>` : ""}</div></div></article>`).join("") : '<div class="empty">No rewards yet. Tap Add reward to begin.</div>'}</div><button class="fab" id="addPrize">＋ Add reward</button>`;
}
/* =========================================================
   KID VIEW SCREEN
   ========================================================= */

function kidView() {
  const kids = model.data.kids || [];
  if (!kids.length) return '<div class="empty">No children found.</div>';
  const max = Number(model.data.settings?.gemsPerTicket || 10);
  const date = model.data.today || new Date().toISOString().slice(0, 10);
  return `<div class="section-head kid-view-title"><h2>Kid View</h2></div><div class="mobile-kids">${kids.map((k) => `<section class="summary-card mobile-kid" data-child="${attr(k.name)}"><div class="kid-name">${esc(k.name)}</div><div class="kid-content"><div class="kid-treasure">${buildTreasureArtworkHtml(k.name, date, k.gems, model.animateKid === k.name)}<div class="ticket-pill">🎟️ ${k.tickets} Tickets</div></div><div class="kid-controls"><button class="good" data-act="addGood" data-kid="${attr(k.name)}">+ Good Choice</button><button class="bonus" data-act="addBonus" data-kid="${attr(k.name)}">+ Bonus Gem</button><button class="oops" data-act="addOops" data-kid="${attr(k.name)}">− Oops</button><button class="undo" data-act="undoLast" data-kid="${attr(k.name)}">Undo</button><div class="kid-gem-total">${k.gems}/${max} Gems</div></div></div></section>`).join("")}</div>`;
}
function photo(p) {
  return p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="">`
    : '<div class="photo-placeholder">🎁</div>';
}
/* =========================================================
   SCREEN EVENTS AND ACTIONS
   ========================================================= */

function bind() {
  document
    .querySelectorAll("[data-go]")
    .forEach((b) => (b.onclick = () => go(b.dataset.go)));
  document
    .querySelectorAll("[data-act]")
    .forEach((b) => (b.onclick = () => act(b)));
  document
    .querySelectorAll("[data-edit]")
    .forEach(
      (card) =>
        (card.onclick = (event) => {
          if (event.target.closest("[data-purchase]")) return;
          openPrize(
            (model.data.prizes || []).find(
              (p) => p.name === card.dataset.edit,
            ),
          );
        }),
    );
  document
    .querySelectorAll("[data-purchase]")
    .forEach(
      (button) =>
        (button.onclick = () => openPurchase(button.dataset.purchase)),
    );
  document.querySelectorAll("[data-select-kid]").forEach(
    (b) =>
      (b.onclick = () => {
        model.selectedKid = b.dataset.selectKid;
        render();
      }),
  );
  document
    .getElementById("addPrize")
    ?.addEventListener("click", () => openPrize(null));
}
async function act(b) {
  const childName = b.dataset.kid;
  const actionName = b.dataset.act;
  const previousData = JSON.stringify(model.data);
  const before = (model.data.kids || []).find((k) => k.name === childName);
  const oldGems = Number(before?.gems || 0);
  const oldTickets = Number(before?.tickets || 0);
  const max = Number(model.data.settings?.gemsPerTicket || 10);
  const positiveDelta =
    actionName === "addGood"
      ? 1
      : actionName === "addBonus"
        ? Number(model.data.settings?.bonusValue || 2)
        : 0;
  const canAnimateImmediately =
    positiveDelta > 0 && oldGems + positiveDelta < max;

  if (canAnimateImmediately) {
    before.gems = oldGems + positiveDelta;
    model.animateKid = childName;
    render();
    model.animateKid = null;
  } else {
    b.closest(".summary-card").classList.add("saving");
  }

  try {
    model.data = await api(actionName, { child: childName });
    const after = (model.data.kids || []).find((k) => k.name === childName);
    const earnedTicket = Number(after?.tickets || 0) > oldTickets;
    render();
    if (earnedTicket) showMobileCelebration(childName);
    else toast("Saved");
  } catch (e) {
    model.data = JSON.parse(previousData);
    toast(e.message);
    render();
  }
}

function showMobileCelebration(childName) {
  const el = document.getElementById("mobileCelebrate");
  el.innerHTML = `<div class="mobile-celebrate-card"><div class="celebrate-kicker">${esc(childName)}</div><div class="celebrate-heading">Daily Quest<br>Complete!</div><div class="celebrate-ticket">🎟️ +1 Ticket</div></div>`;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("show"), 4200);
}
function go(s) {
  model.screen = s;
  render();
  scrollTo(0, 0);
}
document
  .querySelectorAll(".bottom-nav button")
  .forEach((b) => (b.onclick = () => go(b.dataset.screen)));
document.getElementById("refreshBtn").onclick = load;
/* =========================================================
   REWARD EDITOR AND PHOTO UPLOADS
   ========================================================= */

const dlg = document.getElementById("prizeDialog"),
  form = document.getElementById("prizeForm"),
  previewImg = document.getElementById("photoPreview");

const purchaseDialog = document.getElementById("purchaseDialog");

function openPurchase(prizeName) {
  const prize = (model.data.prizes || []).find((p) => p.name === prizeName);
  if (!prize) return;

  document.getElementById("purchaseReward").textContent =
    `${prize.name} · ${prize.cost} tickets`;
  document.getElementById("purchaseKids").innerHTML = (model.data.kids || [])
    .map(
      (kid) =>
        `<button class="purchase-kid" data-redeem-kid="${attr(kid.name)}" data-redeem-prize="${attr(prize.name)}"><span>${esc(kid.name)}</span><small>${kid.tickets} tickets available</small></button>`,
    )
    .join("");

  document.querySelectorAll("[data-redeem-kid]").forEach((button) => {
    button.onclick = () => redeemPurchase(button);
  });
  purchaseDialog.showModal();
}

async function redeemPurchase(button) {
  const child = button.dataset.redeemKid;
  const prize = button.dataset.redeemPrize;
  button.disabled = true;
  button.textContent = "Purchasing…";

  try {
    model.data = await api("redeemPrize", { child, prize });
    purchaseDialog.close();
    render();
    toast(`${prize} purchased for ${child}`);
  } catch (error) {
    alert(error.message || "Could not complete purchase.");
    purchaseDialog.close();
    openPurchase(prize);
  }
}

document.getElementById("closePurchase").onclick = () => purchaseDialog.close();
function openPrize(p) {
  model.editing = p || null;
  form.reset();
  form.originalName.value = p?.name || "";
  form.name.value = p?.name || "";
  form.cost.value = p?.cost || "";
  form.description.value = p?.description || "";
  form.available.checked = p?.available !== false;
  document.getElementById("dialogTitle").textContent = p
    ? "Edit reward"
    : "Add reward";
  document.getElementById("deletePrize").hidden = !p;
  previewImg.hidden = !p?.imageUrl;
  previewImg.src = p?.imageUrl || "";
  dlg.showModal();
}
document.getElementById("closeDialog").onclick = () => dlg.close();
form.photo.onchange = () => {
  const f = form.photo.files[0];
  if (f) {
    previewImg.src = URL.createObjectURL(f);
    previewImg.hidden = false;
  }
};
form.onsubmit = async (e) => {
  e.preventDefault();
  const btn = form.querySelector("[type=submit]");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    let imageUrl = model.editing?.imageUrl || "";
    if (form.photo.files[0])
      imageUrl = await uploadPhoto(form.photo.files[0], form.name.value);
    model.data = await api("savePrize", {
      originalName: form.originalName.value,
      name: form.name.value,
      cost: form.cost.value,
      description: form.description.value,
      imageUrl,
      available: form.available.checked ? "YES" : "NO",
    });
    dlg.close();
    render();
    toast("Reward saved");
  } catch (err) {
    alert(err.message || "Could not save reward.");
    toast(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Save reward";
  }
};
document.getElementById("deletePrize").onclick = async () => {
  if (!confirm(`Delete ${form.name.value}?`)) return;
  try {
    model.data = await api("deletePrize", { name: form.originalName.value });
    dlg.close();
    render();
    toast("Reward deleted");
  } catch (e) {
    toast(e.message);
  }
};
async function uploadPhoto(file, name) {
  const imageData = await compress(file);
  const token = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const f = document.createElement("form");
  f.method = "POST";
  f.action = window.CHOICE_QUEST_CONFIG.apiUrl;
  f.target = "uploadFrame";
  f.style.display = "none";
  for (const [k, v] of Object.entries({
    action: "uploadPrizePhoto",
    token,
    name,
    imageData,
  })) {
    const i = document.createElement("input");
    i.name = k;
    i.value = v;
    f.appendChild(i);
  }
  document.body.appendChild(f);
  f.submit();
  f.remove();
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const result = await api("getPrizeUploadResult", { token });
    if (result.pending) continue;
    if (result.ok) return result.imageUrl;
    throw new Error(result.error || "Photo upload failed.");
  }
  throw new Error("Photo upload timed out.");
}
function compress(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(),
      r = new FileReader();
    r.onload = () => (img.src = r.result);
    r.onerror = reject;
    img.onload = () => {
      const max = 1200,
        scale = Math.min(1, max / Math.max(img.width, img.height)),
        c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.78));
    };
    r.readAsDataURL(file);
  });
}
/* =========================================================
   FEEDBACK AND SAFE TEXT HELPERS
   ========================================================= */

function toast(t) {
  const x = document.getElementById("toast");
  x.textContent = t;
  x.style.display = "block";
  clearTimeout(x._t);
  x._t = setTimeout(() => (x.style.display = "none"), 2600);
}
function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function attr(v) {
  return esc(v).replace(/`/g, "&#96;");
}
window.load = load;
load();
