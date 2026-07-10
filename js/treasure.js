/**
 * Choice Quest treasure rendering.
 * Slot and color choices are deterministic for each child/day so the pile
 * remains stable across refreshes while still looking different each day.
 */

function treasureHash(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function treasureRandom(seed) {
  let stateValue = seed >>> 0;
  return function nextRandom() {
    stateValue += 0x6D2B79F5;
    let t = stateValue;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledTreasureItems(items, random) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getTreasureLayout(childName, dateKey, count) {
  const treasure = CONSTANTS.TREASURE;
  const visibleCount = Math.min(
    Math.max(0, Number(count) || 0),
    treasure.maxVisibleGems,
    treasure.slots.length
  );
  const random = treasureRandom(treasureHash(`${childName}|${dateKey || 'today'}`));
  const slots = shuffledTreasureItems(treasure.slots, random);
  const colors = treasure.gemAssets;

  return Array.from({ length: visibleCount }, (_, index) => ({
    slot: slots[index],
    asset: colors[Math.floor(random() * colors.length)],
    index
  }));
}

function buildTreasureArtworkHtml(childName, dateKey, count, animateNewGem, loading = false) {
  const items = getTreasureLayout(childName, dateKey, count);
  const newestIndex = items.length - 1;
  const gemHtml = items.map(item => buildTreasureGemHtml(
    item,
    animateNewGem && item.index === newestIndex
  )).join('');

  return `
    <div class="treasure-art${loading ? ' loading-treasure' : ''}">
      <img class="treasure-chest-image" src="${CONSTANTS.TREASURE.chestAsset}" alt="Open treasure chest">
      <div class="treasure-gem-layer" aria-hidden="true">${gemHtml}</div>
      <div class="treasure-chest-foreground" aria-hidden="true"></div>
    </div>
  `;
}

function buildTreasureGemHtml(item, animate) {
  const slot = item.slot;
  const animationClass = animate ? ' treasure-gem-drop' : '';
  const zIndex = Math.round(slot.y * 10);
  return `
    <img
      class="treasure-gem${animationClass}"
      src="${item.asset}"
      alt=""
      style="
        --slot-x:${slot.x}%;
        --slot-y:${slot.y}%;
        --drop-x:${slot.dropX}%;
        --drop-y:${slot.dropY}%;
        --gem-rotation:${slot.rotation}deg;
        --gem-scale:${slot.scale};
        z-index:${zIndex};
      ">
  `;
}
