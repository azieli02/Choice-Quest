const APP = {
  SHEETS: {
    SETTINGS: 'Settings',
    KIDS: 'Kids',
    PRIZES: 'Prize Store',
    HISTORY: 'History',
    CATEGORIES: 'Future Categories'
  },
  DEFAULT_KIDS: ['Jeremiah', 'Colton'],
  DEFAULT_GEMS_PER_TICKET: 10,
  DEFAULT_BONUS_VALUE: 2,
  STARTING_TICKETS: 4
};

function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest_(e);
  }

  // Legacy Apps Script UI remains available during the GitHub migration.
  const template = HtmlService.createTemplateFromFile('Index');
  template.view = (e && e.parameter && e.parameter.view) || 'parent';
  return template
    .evaluate()
    .setTitle('Choice Quest')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSettingsSheet_(ss);
  ensureKidsSheet_(ss);
  ensurePrizeSheet_(ss);
  ensureHistorySheet_(ss);
  ensureCategoriesSheet_(ss);
  resetIfNewDay_(ss);
  return getState();
}

function getState() {
  setupSheetsNoReturn_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetIfNewDay_(ss);
  const settings = getSettings_(ss);
  return {
    today: today_(),
    settings,
    kids: readKids_(ss),
    prizes: [],
    history: [],
    views: {
      parent: safeServiceUrl_(),
      dakboard: safeServiceUrl_() + '?view=dakboard'
    }
  };
}

function addGood(childName) {
  return applyGemAction_(childName, 'Good', 1, '');
}

function addBonus(childName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSettings_(ss);
  return applyGemAction_(childName, 'Bonus', Number(settings.bonusValue || APP.DEFAULT_BONUS_VALUE), '');
}

function addOops(childName) {
  return applyGemAction_(childName, 'Oops', -1, '');
}

function undoLast(childName) {
  setupSheetsNoReturn_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetIfNewDay_(ss);
  const history = ss.getSheetByName(APP.SHEETS.HISTORY);
  const rows = history.getDataRange().getValues();
  if (rows.length <= 1) return getState();

  for (let i = rows.length - 1; i >= 1; i--) {
    const row = rows[i];
    const rowChild = row[2];
    const action = row[3];
    const undone = row[8];
    if (rowChild === childName && undone !== 'YES' && action !== 'Undo' && action !== 'Daily Reset') {
      const gemDelta = Number(row[4] || 0);
      const ticketDelta = Number(row[5] || 0);
      updateKidByDelta_(ss, childName, -gemDelta, -ticketDelta, true);
      history.getRange(i + 1, 9).setValue('YES');
      logAction_(ss, childName, 'Undo', -gemDelta, -ticketDelta, '', 'Reversed: ' + action);
      return getState();
    }
  }
  return getState();
}

function redeemPrize(childName, prizeName) {
  setupSheetsNoReturn_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetIfNewDay_(ss);
  const prize = readPrizes_(ss).find(p => p.name === prizeName && p.available === true);
  if (!prize) throw new Error('Prize not found or unavailable.');
  const kid = readKids_(ss).find(k => k.name === childName);
  if (!kid) throw new Error('Child not found.');
  if (kid.tickets < prize.cost) throw new Error(childName + ' does not have enough tickets for this prize.');
  updateKidByDelta_(ss, childName, 0, -Number(prize.cost), false);
  logAction_(ss, childName, 'Redeem Prize', 0, -Number(prize.cost), '', prizeName);
  return getState();
}

function applyGemAction_(childName, action, value, category) {
  setupSheetsNoReturn_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetIfNewDay_(ss);
  const settings = getSettings_(ss);
  const gemsPerTicket = Number(settings.gemsPerTicket || APP.DEFAULT_GEMS_PER_TICKET);
  const kid = readKids_(ss).find(k => k.name === childName);
  if (!kid) throw new Error('Child not found: ' + childName);

  const oldGems = Number(kid.gems || 0);
  const oldTickets = Number(kid.tickets || 0);
  let newGems = oldGems + Number(value);
  if (newGems < 0) newGems = 0;

  let ticketDelta = 0;
  let note = '';

  if (newGems >= gemsPerTicket) {
    ticketDelta = Math.floor(newGems / gemsPerTicket);
    newGems = settings.noCarryover ? 0 : newGems % gemsPerTicket;
    note = settings.noCarryover ? 'Quest complete; gems reset with no carryover.' : 'Quest complete; overflow gems carried over.';
  }

  const gemDelta = newGems - oldGems;
  setKidValues_(ss, childName, newGems, oldTickets + ticketDelta);
  logAction_(ss, childName, action, gemDelta, ticketDelta, category || '', note);
  return getState();
}

function resetToday() {
  setupSheetsNoReturn_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  resetAllGems_(ss, 'Manual daily quest reset.');
  setSetting_(ss, 'LastResetDate', today_());
  return getState();
}

function updateKidByDelta_(ss, childName, gemDelta, ticketDelta, allowNegativeTicket) {
  const sheet = ss.getSheetByName(APP.SHEETS.KIDS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === childName) {
      const gems = Math.max(0, Number(rows[i][1] || 0) + Number(gemDelta));
      let tickets = Number(rows[i][2] || 0) + Number(ticketDelta);
      if (!allowNegativeTicket) tickets = Math.max(0, tickets);
      sheet.getRange(i + 1, 2, 1, 3).setValues([[gems, tickets, new Date()]]);
      return;
    }
  }
}

function setKidValues_(ss, childName, gems, tickets) {
  const sheet = ss.getSheetByName(APP.SHEETS.KIDS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === childName) {
      sheet.getRange(i + 1, 2, 1, 3).setValues([[gems, Math.max(0, tickets), new Date()]]);
      return;
    }
  }
}

function logAction_(ss, childName, action, gemDelta, ticketDelta, category, note) {
  ss.getSheetByName(APP.SHEETS.HISTORY).appendRow([
    new Date(),
    today_(),
    childName,
    action,
    gemDelta,
    ticketDelta,
    category || '',
    note || '',
    ''
  ]);
}

function getSettings_(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP.SHEETS.SETTINGS);
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  const seen = {};
  rows.slice(1).forEach((row,index) => {
    const key = String(row[0]||'').trim();
    if (!key) return;
    if (seen[key]) throw new Error('Duplicate setting "'+key+'" found in Settings (rows '+seen[key]+' and '+(index+2)+').');
    seen[key]=index+2;
    settings[key]=row[1];
  });
  ['GemsPerTicket','BonusValue','NoCarryover','LastResetDate'].forEach(k=>{if(!(k in settings)) throw new Error('Missing required setting: '+k);});
  const gemsPerTicket = Number(settings.GemsPerTicket || settings.MarblesPerTicket || APP.DEFAULT_GEMS_PER_TICKET);
  return {
    gemsPerTicket,
    marblesPerTicket: gemsPerTicket, // Legacy alias for older front-end versions.
    bonusValue: Number(settings.BonusValue || APP.DEFAULT_BONUS_VALUE),
    noCarryover: String(settings.NoCarryover || 'TRUE').toUpperCase() === 'TRUE',
    lastResetDate: normalizeDate_(settings.LastResetDate || '')
  };
}

function setSetting_(ss, key, value) {
  const sheet = ss.getSheetByName(APP.SHEETS.SETTINGS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function readKids_(ss) {
  const rows = ss.getSheetByName(APP.SHEETS.KIDS).getDataRange().getValues();
  return rows.slice(1).filter(r => r[0]).map(r => {
    const gems = Number(r[1] || 0);
    return {
      name: String(r[0]),
      gems,
      marbles: gems, // Legacy alias for older front-end versions.
      tickets: Number(r[2] || 0),
      updatedAt: r[3] ? String(r[3]) : ''
    };
  });
}

function readPrizes_(ss) {
  const rows = ss.getSheetByName(APP.SHEETS.PRIZES).getDataRange().getValues();
  return rows.slice(1).filter(r => r[0]).map(r => ({
    name: String(r[0]),
    cost: Number(r[1] || 0),
    imageUrl: String(r[2] || ''),
    available: String(r[3] || 'YES').toUpperCase() !== 'NO'
  }));
}

function readRecentHistory_(ss, limit) {
  const sheet = ss.getSheetByName(APP.SHEETS.HISTORY);
  const rows = sheet.getDataRange().getValues();
  const data = rows.slice(1).slice(-limit).reverse();
  return data.map(r => ({
    timestamp: r[0] ? String(r[0]) : '',
    date: String(r[1] || ''),
    child: String(r[2] || ''),
    action: String(r[3] || ''),
    gemDelta: Number(r[4] || 0),
    ticketDelta: Number(r[5] || 0),
    category: String(r[6] || ''),
    note: String(r[7] || ''),
    undone: String(r[8] || '')
  }));
}

function resetIfNewDay_(ss) {
  const settings = getSettings_(ss);
  const today = today_();
  if (!settings.lastResetDate) {
    setSetting_(ss, 'LastResetDate', today);
    return;
  }
  if (settings.lastResetDate !== today) {
    resetAllGems_(ss, 'Automatic daily quest reset.');
    setSetting_(ss, 'LastResetDate', today);
  }
}

function resetAllGems_(ss, note) {
  const sheet = ss.getSheetByName(APP.SHEETS.KIDS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    const oldGems = Number(rows[i][1] || 0);
    if (oldGems !== 0) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[0, Number(rows[i][2] || 0)]]);
      sheet.getRange(i + 1, 4).setValue(new Date());
      logAction_(ss, String(rows[i][0]), 'Daily Reset', -oldGems, 0, '', note);
    }
  }
}

function ensureSettingsSheet_(ss) {
  const sheet = ss.getSheetByName(APP.SHEETS.SETTINGS) || ss.insertSheet(APP.SHEETS.SETTINGS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Setting', 'Value']);
    sheet.appendRow(['GemsPerTicket', APP.DEFAULT_GEMS_PER_TICKET]);
    sheet.appendRow(['BonusValue', APP.DEFAULT_BONUS_VALUE]);
    sheet.appendRow(['NoCarryover', 'TRUE']);
    sheet.appendRow(['LastResetDate', today_()]);
    sheet.setFrozenRows(1);
  }
}

function ensureKidsSheet_(ss) {
  const sheet = ss.getSheetByName(APP.SHEETS.KIDS) || ss.insertSheet(APP.SHEETS.KIDS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Name', 'Today Gems', 'Tickets', 'Last Updated']);
    APP.DEFAULT_KIDS.forEach(name => sheet.appendRow([name, 0, APP.STARTING_TICKETS, new Date()]));
    sheet.setFrozenRows(1);
  }
}

function ensurePrizeSheet_(ss) {
  const sheet = ss.getSheetByName(APP.SHEETS.PRIZES) || ss.insertSheet(APP.SHEETS.PRIZES);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Prize Name', 'Ticket Cost', 'Image URL', 'Available YES/NO']);
    sheet.appendRow(['Example: Ice Cream', 5, '', 'YES']);
    sheet.appendRow(['Example: Movie Night', 10, '', 'YES']);
    sheet.appendRow(['Example: Small Toy', 20, '', 'YES']);
    sheet.setFrozenRows(1);
  }
}

function ensureHistorySheet_(ss) {
  const sheet = ss.getSheetByName(APP.SHEETS.HISTORY) || ss.insertSheet(APP.SHEETS.HISTORY);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Date', 'Child', 'Action', 'Gem Delta', 'Ticket Delta', 'Future Category', 'Note', 'Undone']);
    sheet.setFrozenRows(1);
  }
}

function ensureCategoriesSheet_(ss) {
  const sheet = ss.getSheetByName(APP.SHEETS.CATEGORIES) || ss.insertSheet(APP.SHEETS.CATEGORIES);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Category', 'Enabled YES/NO']);
    sheet.appendRow(['Listening', 'NO']);
    sheet.appendRow(['Safe Body', 'NO']);
    sheet.appendRow(['Kind Words', 'NO']);
    sheet.appendRow(['Following Directions', 'NO']);
    sheet.appendRow(['Transitions', 'NO']);
    sheet.appendRow(['Other', 'NO']);
    sheet.setFrozenRows(1);
  }
}

function setupSheetsNoReturn_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSettingsSheet_(ss);
  ensureKidsSheet_(ss);
  ensurePrizeSheet_(ss);
  ensureHistorySheet_(ss);
  ensureCategoriesSheet_(ss);
}


function normalizeDate_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return text;
}

function today_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function safeServiceUrl_() {
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (e) {
    return '';
  }
}


/**
 * Choice Quest v2.0 JSONP API for the GitHub Pages frontend.
 * JSONP is used because it works reliably across origins without CORS preflight.
 */
function handleApiRequest_(e) {
  const params = (e && e.parameter) || {};
  const callback = sanitizeCallback_(params.callback || 'choiceQuestCallback');

  try {
    let data;
    switch (String(params.action || 'getState')) {
      case 'getState':
        data = getState();
        break;
      case 'addGood':
        data = addGood(requireApiParam_(params, 'child'));
        break;
      case 'addBonus':
        data = addBonus(requireApiParam_(params, 'child'));
        break;
      case 'addOops':
        data = addOops(requireApiParam_(params, 'child'));
        break;
      case 'undoLast':
        data = undoLast(requireApiParam_(params, 'child'));
        break;
      case 'redeemPrize':
        data = redeemPrize(
          requireApiParam_(params, 'child'),
          requireApiParam_(params, 'prize')
        );
        break;
      default:
        throw new Error('Unknown API action: ' + params.action);
    }

    return jsonpResponse_(callback, { ok: true, data: data });
  } catch (error) {
    return jsonpResponse_(callback, {
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function jsonpResponse_(callback, payload) {
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sanitizeCallback_(callback) {
  const safe = String(callback || '').replace(/[^a-zA-Z0-9_.$]/g, '');
  if (!safe) throw new Error('Invalid JSONP callback.');
  return safe;
}

function requireApiParam_(params, name) {
  const value = String(params[name] || '').trim();
  if (!value) throw new Error('Missing API parameter: ' + name);
  return value;
}
