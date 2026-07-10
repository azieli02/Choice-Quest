/**
 * Choice Quest
 * Version: 2.0
 * File: JavaScript.html
 * Purpose: Clean front-end state, rendering, optimistic updates, celebrations, and Google Sheets sync.
 */

/* =========================================================
   CONFIGURATION
   ========================================================= */

const CONFIG = {
  view: 'github',
  defaults: {
    gemsPerTicket: 10,
    bonusValue: 2,
    historyLimit: 12,
    loadingKids: ['Jeremiah', 'Colton']
  },
  timing: {
    dakboardRefreshMs: 15000,
    toastMs: 2600,
    celebrationEmptyMs: 4700,
    celebrationEndMs: 6100,
    confettiRemoveMs: 4200
  },
  animation: {
    confettiCount: 56,
    confettiMaxDelaySeconds: 1.2,
    confettiMaxRotationDegrees: 180
  },
  gems: {
    colors: ['#2563eb', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'],
    positions: [
      [86, 92, -9], [48, 92, 8], [123, 91, 12], [66, 66, -14], [105, 65, 7],
      [28, 46, -6], [84, 42, 15], [140, 47, -12], [54, 18, 10], [114, 17, -8]
    ]
  },
  actions: {
    addGood: { label: 'Good', delta: 1 },
    addBonus: { label: 'Bonus', getDelta: () => getBonusValue() },
    addOops: { label: 'Oops', delta: -1 }
  }
};

const IS_DAKBOARD = false;

const state = {
  data: null,
  rendered: false,
  savingKids: new Set(),
  celebrations: {},
  timers: {},
  dom: {}
};

/* =========================================================
   STARTUP
   ========================================================= */

function init() {
  cacheCoreDom();
  renderLoadingShell();
  refresh({ full: true });
  window.setInterval(refresh, Number(window.CHOICE_QUEST_CONFIG.refreshMs || CONFIG.timing.dakboardRefreshMs));
}

function refresh(options = {}) {
  setLoading(true);
  return callServer('getState')
    .then(data => {
      renderApp(normalizeState(data), { full: options.full === true || !state.rendered });
      setLoading(false);
    })
    .catch(error => {
      setLoading(false);
      showError(error);
    });
}

/* =========================================================
   SERVER COMMUNICATION
   ========================================================= */

function callServer(functionName, ...args) {
  return new Promise((resolve, reject) => {
    const apiUrl = window.CHOICE_QUEST_CONFIG && window.CHOICE_QUEST_CONFIG.apiUrl;
    if (!apiUrl) {
      reject(new Error('Apps Script API URL is missing from js/config.js.'));
      return;
    }

    const callbackName = `choiceQuestCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const params = new URLSearchParams({
      action: functionName,
      callback: callbackName,
      _: String(Date.now())
    });

    if (args[0] !== undefined) params.set('child', String(args[0]));
    if (args[1] !== undefined) params.set('prize', String(args[1]));

    const script = document.createElement('script');
    const timeoutMs = Number(window.CHOICE_QUEST_CONFIG.requestTimeoutMs || 15000);
    let timer;

    const cleanup = () => {
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = payload => {
      cleanup();
      if (payload && payload.ok === false) {
        reject(new Error(payload.error || 'The Choice Quest API returned an error.'));
        return;
      }
      resolve(payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Could not reach the Choice Quest Apps Script API.'));
    };

    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('The Choice Quest API request timed out.'));
    }, timeoutMs);

    script.src = `${apiUrl}?${params.toString()}`;
    document.head.appendChild(script);
  });
}

function saveAction(functionName, childName, previousState) {
  callServer(functionName, childName)
    .then(data => {
      state.savingKids.delete(childName);
      state.data = normalizeState(data);
      renderAfterSave(childName);
    })
    .catch(error => rollbackAction(childName, previousState, error));
}

function rollbackAction(childName, previousState, error) {
  state.savingKids.delete(childName);
  state.data = previousState;
  delete state.celebrations[toId(childName)];

  renderChild(childName);
  toast('Could not save. I rolled that tap back.');
  console.error(error);
}

/* =========================================================
   STATE HELPERS
   ========================================================= */

function normalizeState(data) {
  const safe = data || {};
  return {
    ...safe,
    settings: safe.settings || {},
    kids: (safe.kids || []).map(normalizeKid),
    prizes: safe.prizes || [],
    history: safe.history || []
  };
}

function normalizeKid(kid) {
  return {
    ...kid,
    gems: Number(kid.gems ?? kid.marbles ?? 0),
    tickets: Number(kid.tickets || 0)
  };
}

function copyState() {
  return JSON.parse(JSON.stringify(state.data));
}

function getKid(childName) {
  return (state.data.kids || []).find(kid => kid.name === childName);
}

function getSettings() {
  return state.data && state.data.settings ? state.data.settings : {};
}

function getGemsPerTicket() {
  return Number(getSettings().gemsPerTicket || getSettings().marblesPerTicket || CONFIG.defaults.gemsPerTicket);
}

function getBonusValue() {
  return Number(getSettings().bonusValue || CONFIG.defaults.bonusValue);
}

function getNoCarryover() {
  return getSettings().noCarryover !== false;
}

function getActionConfig(functionName) {
  const action = CONFIG.actions[functionName] || { label: '', delta: 0 };
  return {
    label: action.label,
    delta: action.getDelta ? action.getDelta() : action.delta
  };
}

/* =========================================================
   DOM HELPERS
   ========================================================= */

function cacheCoreDom() {
  state.dom.root = document.getElementById('root');
  state.dom.links = document.getElementById('links');
  state.dom.celebrate = document.getElementById('celebrate');
}

function cacheDynamicDom() {
  state.dom.kidGrid = document.getElementById('kidGrid');
}

function getRoot() {
  if (!state.dom.root) state.dom.root = document.getElementById('root');
  return state.dom.root;
}

function setLoading(isLoading) {
  document.body.classList.toggle('is-loading', isLoading);
}

/* =========================================================
   RENDERING
   ========================================================= */

function renderApp(data, options = {}) {
  state.data = data;
  const root = getRoot();
  root.className = 'content';

  if (shouldRenderFullPage(options)) {
    root.innerHTML = buildMainHtml();
    state.rendered = true;
    cacheDynamicDom();
  } else {
    renderAllChildren();
  }

  renderDakboardHelp();
}

function shouldRenderFullPage(options) {
  return options.full || !state.rendered || !document.querySelector('.kid-card[data-child]');
}

function buildMainHtml() {
  return `<section class="grid" id="kidGrid">${state.data.kids.map(buildKidCardHtml).join('')}</section>`;
}

function renderLoadingShell() {
  const root = getRoot();
  root.className = 'content loading-content';
  root.innerHTML = `
    <section class="grid" id="kidGrid">
      ${CONFIG.defaults.loadingKids.map(buildLoadingCardHtml).join('')}
    </section>
  `;
}

function buildLoadingCardHtml(name) {
  return `
    <article class="kid-card loading-card">
      <div class="kid-top">
        <div>
          <h2>${escapeHtml(name)}</h2>
          <div class="saving-badge">Loading...</div>
        </div>
        <div class="ticket-pill">🎟️ -- Tickets</div>
      </div>
      <div class="treasure-stage">${buildTreasureHtml(0, CONFIG.defaults.gemsPerTicket, false, true)}</div>
      <div class="meter">
        <div class="big-progress">Loading...</div>
        <div class="hint">Preparing today’s quest</div>
      </div>
    </article>
  `;
}

function renderAllChildren() {
  state.data.kids.forEach(kid => renderChild(kid.name));
}

function renderChild(childName, options = {}) {
  const kid = getKid(childName);
  const card = document.getElementById(`kid-${toId(childName)}`);
  if (!kid || !card) return;

  card.className = getChildCardClasses(childName);
  card.innerHTML = buildKidCardInnerHtml(kid, options.animate === true);
}

function renderAfterSave(childName) {
  if (!state.celebrations[toId(childName)]) renderChild(childName);
}

function renderDakboardHelp() {}

/* =========================================================
   CHILD CARDS
   ========================================================= */

function buildKidCardHtml(kid) {
  return `
    <article class="${getChildCardClasses(kid.name)}" id="kid-${toId(kid.name)}" data-child="${escapeAttr(kid.name)}">
      ${buildKidCardInnerHtml(kid, false)}
    </article>
  `;
}

function buildKidCardInnerHtml(kid, animateNewGem) {
  const perTicket = getGemsPerTicket();
  const isCelebrating = !!state.celebrations[toId(kid.name)];
  const gemCount = isCelebrating ? perTicket : Number(kid.gems || 0);

  return `
    <div class="kid-top">
      <div>
        <h2>${escapeHtml(kid.name)}</h2>
        
      </div>
      <div class="ticket-pill"><span>🎟️</span> ${kid.tickets} Tickets</div>
    </div>

    <div class="treasure-stage">${buildTreasureHtml(gemCount, perTicket, animateNewGem && !isCelebrating)}</div>

    <div class="meter">
      <div class="big-progress">${gemCount} / ${perTicket}</div>
      <div class="hint">${getProgressMessage(gemCount, perTicket)}</div>
      <div class="saving-badge">Saving...</div>
    </div>

    <div class="buttons parent-only">
      <button class="good" onclick="act('addGood','${escapeAttr(kid.name)}')">+ Good Choice</button>
      <button class="bonus" onclick="act('addBonus','${escapeAttr(kid.name)}')">+ Bonus Gem</button>
      <button class="oops" onclick="act('addOops','${escapeAttr(kid.name)}')">- Oops</button>
      <button class="undo" onclick="act('undoLast','${escapeAttr(kid.name)}')">Undo</button>
    </div>
  `;
}

function getChildCardClasses(childName) {
  const childId = toId(childName);
  const classes = ['kid-card'];

  if (state.savingKids.has(childName)) classes.push('saving');
  if (state.celebrations[childId]) {
    classes.push(state.celebrations[childId].phase === 'emptying' ? 'emptying' : 'celebrating');
  }

  return classes.join(' ');
}

function getProgressMessage(count, perTicket) {
  const remaining = Math.max(0, perTicket - count);
  if (count >= perTicket) return 'Quest complete!';
  if (count === 0) return 'Find gems to complete the quest!';
  return `${remaining} more gem${remaining === 1 ? '' : 's'} to complete the quest`;
}

/* =========================================================
   TREASURE CHEST
   ========================================================= */

function buildTreasureHtml(count, perTicket, animateNewGem, loading = false) {
  const gemCount = Math.min(count, perTicket, CONFIG.gems.positions.length);
  const gems = Array.from({ length: gemCount }, (_, index) => (
    buildGemHtml(index, gemCount, animateNewGem)
  )).join('');

  return `
    <div class="chest-area${loading ? ' loading-treasure' : ''}">
            <div class="chest-lid" aria-hidden="true"><span class="chest-band"></span></div>
      <div class="chest">
        <div class="chest-fill-line"></div>
        <div class="chest-shine"></div>
        <div class="chest-lock"></div>
        ${gems}
      </div>
      <div class="shelf"></div>
    </div>
  `;
}

function buildGemHtml(index, gemCount, animateNewGem) {
  const [left, top, rotation = 0] = CONFIG.gems.positions[index];
  const color = CONFIG.gems.colors[index % CONFIG.gems.colors.length];
  const animationClass = animateNewGem && index === gemCount - 1 ? ' drop' : '';

  return `<span class="gem${animationClass}" style="left:${left}px;top:${top}px;--gem-color:${color};--gem-rotate:${rotation}deg"><span class="gem-facet gem-facet-a"></span><span class="gem-facet gem-facet-b"></span><span class="gem-facet gem-facet-c"></span></span>`;
}

/* =========================================================
   ACTIONS
   ========================================================= */

function act(functionName, childName) {
  if (!state.data || state.celebrations[toId(childName)]) return;

  const previousState = copyState();
  const result = applyLocalAction(functionName, childName);

  if (result.changed) {
    state.savingKids.add(childName);
    renderChild(childName, { animate: result.animate });
    if (result.celebrate) startTicketCelebration(childName);
  }

  saveAction(functionName, childName, previousState);
}


/* =========================================================
   OPTIMISTIC LOCAL UPDATES
   ========================================================= */

function applyLocalAction(functionName, childName) {
  if (functionName === 'undoLast') return applyLocalUndo(childName);

  const kid = getKid(childName);
  if (!kid) return noLocalChange();

  const action = getActionConfig(functionName);
  const oldGems = kid.gems;
  const oldTickets = kid.tickets;

  const ticketResult = calculateTicketResult(oldGems + action.delta, oldTickets);
  kid.gems = ticketResult.gems;
  kid.tickets = ticketResult.tickets;

  addLocalHistory({
    child: childName,
    action: action.label,
    gemDelta: kid.gems - oldGems,
    ticketDelta: kid.tickets - oldTickets,
    note: ticketResult.note
  });

  return {
    changed: true,
    animate: action.delta > 0 && !ticketResult.celebrate,
    celebrate: ticketResult.celebrate
  };
}

function calculateTicketResult(rawGems, currentTickets) {
  const perTicket = getGemsPerTicket();
  const safeGems = Math.max(0, Number(rawGems || 0));

  if (safeGems < perTicket) {
    return { gems: safeGems, tickets: currentTickets, note: '', celebrate: false };
  }

  const earnedTickets = Math.floor(safeGems / perTicket);
  const gems = getNoCarryover() ? 0 : safeGems % perTicket;
  const note = getNoCarryover()
    ? 'Quest complete; gems reset with no carryover.'
    : 'Quest complete; overflow gems carried over.';

  return {
    gems,
    tickets: currentTickets + earnedTickets,
    note,
    celebrate: earnedTickets > 0
  };
}

function applyLocalUndo(childName) {
  const kid = getKid(childName);
  const item = findUndoableHistoryItem(childName);
  if (!kid || !item) return noLocalChange();

  const gemDelta = Number(item.gemDelta || 0);
  const ticketDelta = Number(item.ticketDelta || 0);

  kid.gems = Math.max(0, kid.gems - gemDelta);
  kid.tickets = Math.max(0, kid.tickets - ticketDelta);
  item.undone = 'YES';

  addLocalHistory({
    child: childName,
    action: 'Undo',
    gemDelta: -gemDelta,
    ticketDelta: -ticketDelta,
    note: `Reversed: ${item.action}`
  });

  return { changed: true, animate: false, celebrate: false };
}

function findUndoableHistoryItem(childName) {
  return (state.data.history || []).find(item => (
    item.child === childName &&
    item.action !== 'Undo' &&
    item.action !== 'Daily Reset' &&
    item.undone !== 'YES'
  ));
}

function addLocalHistory({ child, action, gemDelta, ticketDelta, note }) {
  state.data.history.unshift({
    child,
    action,
    gemDelta,
    ticketDelta,
    note: note || '',
    date: state.data.today || '',
    undone: ''
  });

  state.data.history = state.data.history.slice(0, CONFIG.defaults.historyLimit);
}

function noLocalChange() {
  return { changed: false, animate: false, celebrate: false };
}

/* =========================================================
   CELEBRATION
   ========================================================= */

function startTicketCelebration(childName) {
  const childId = toId(childName);
  clearCelebrationTimers(childId);

  state.celebrations[childId] = { phase: 'full' };
  renderChild(childName);
  showCelebration(`${escapeHtml(childName)}`);

  state.timers[`${childId}-empty`] = window.setTimeout(() => {
    if (!state.celebrations[childId]) return;
    state.celebrations[childId].phase = 'emptying';
    renderChild(childName);
  }, CONFIG.timing.celebrationEmptyMs);

  state.timers[`${childId}-end`] = window.setTimeout(() => {
    delete state.celebrations[childId];
    renderChild(childName);
  }, CONFIG.timing.celebrationEndMs);
}

function clearCelebrationTimers(childId) {
  window.clearTimeout(state.timers[`${childId}-empty`]);
  window.clearTimeout(state.timers[`${childId}-end`]);
}

function showCelebration(text) {
  const celebrate = state.dom.celebrate || document.getElementById('celebrate');
  celebrate.innerHTML = `
    <div class="celebrate-card">
      <div class="celebrate-kicker">${text}</div>
      <div class="celebrate-title">Daily Quest Complete!</div>
      <div class="gold-ticket">🎟️ +1 Ticket</div>
    </div>
  `;

  celebrate.classList.remove('show');
  void celebrate.offsetWidth;
  celebrate.classList.add('show');

  makeConfetti();
  window.setTimeout(() => celebrate.classList.remove('show'), CONFIG.timing.celebrationEndMs);
}

function makeConfetti() {
  for (let i = 0; i < CONFIG.animation.confettiCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = CONFIG.gems.colors[i % CONFIG.gems.colors.length];
    piece.style.animationDelay = `${Math.random() * CONFIG.animation.confettiMaxDelaySeconds}s`;
    piece.style.transform = `rotate(${Math.random() * CONFIG.animation.confettiMaxRotationDegrees}deg)`;
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), CONFIG.timing.confettiRemoveMs);
  }
}

/* =========================================================
   FEEDBACK + ERRORS
   ========================================================= */

function toast(message) {
  const el = getOrCreateToast();
  el.textContent = message;
  el.style.display = 'block';

  window.clearTimeout(el._timer);
  el._timer = window.setTimeout(() => {
    el.style.display = 'none';
  }, CONFIG.timing.toastMs);
}

function getOrCreateToast() {
  let el = document.getElementById('toast');
  if (el) return el;

  el = document.createElement('div');
  el.id = 'toast';
  el.className = 'toast';
  document.body.appendChild(el);
  return el;
}

function showError(error) {
  const message = error && error.message ? error.message : String(error || 'Unknown error');
  const root = getRoot();
  root.className = 'error';
  root.innerHTML = `Something went wrong:<br><b>${escapeHtml(message)}</b><br><br><button class="ghost" onclick="refresh()">Try Again</button>`;
}

/* =========================================================
   UTILITIES
   ========================================================= */

function toId(value) {
  return String(value).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

/* =========================================================
   GLOBALS USED BY INLINE HTML HANDLERS
   ========================================================= */

window.refresh = refresh;
window.act = act;

init();