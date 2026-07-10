const CONSTANTS = Object.freeze({
  TREASURE: Object.freeze({
    maxVisibleGems: 10,
    chestAsset: 'assets/treasure/Choice-Quest-Treasure-Chest.PNG',
    gemAssets: Object.freeze([
      'assets/gems/Choice-Quest-Gem-Blue.PNG',
      'assets/gems/Choice-Quest-Gem-Yellow.PNG',
      'assets/gems/Choice-Quest-Gem-Green.PNG',
      'assets/gems/Choice-Quest-Gem-Pink.PNG',
      'assets/gems/Choice-Quest-Gem-Red.PNG',
      'assets/gems/Choice-Quest-Gem-Purple.PNG'
    ]),
    // Twelve staggered slots create a fuller 3 / 4 / 5 pile while still
    // showing at most ten gems for the current daily goal. Each slot keeps
    // its own nearby drop point, rotation, scale, and final position.
    slots: Object.freeze([
      // Back row — 3
      Object.freeze({ x: 31.5, y: 40.2, dropX: 31.0, dropY: -14, rotation: -5, scale: 0.94 }),
      Object.freeze({ x: 50.5, y: 39.5, dropX: 50.0, dropY: -16, rotation:  3, scale: 0.97 }),
      Object.freeze({ x: 69.0, y: 40.4, dropX: 69.5, dropY: -13, rotation: -4, scale: 0.93 }),

      // Middle row — 4
      Object.freeze({ x: 23.5, y: 44.8, dropX: 23.0, dropY: -13, rotation:  5, scale: 1.00 }),
      Object.freeze({ x: 41.0, y: 44.1, dropX: 41.5, dropY: -15, rotation: -3, scale: 1.03 }),
      Object.freeze({ x: 58.5, y: 44.7, dropX: 58.0, dropY: -14, rotation:  4, scale: 1.02 }),
      Object.freeze({ x: 76.0, y: 44.2, dropX: 76.5, dropY: -13, rotation: -5, scale: 0.99 }),

      // Front row — 5
      Object.freeze({ x: 16.5, y: 49.4, dropX: 16.0, dropY: -12, rotation: -4, scale: 1.07 }),
      Object.freeze({ x: 33.0, y: 48.8, dropX: 33.5, dropY: -14, rotation:  5, scale: 1.10 }),
      Object.freeze({ x: 49.5, y: 49.6, dropX: 49.0, dropY: -16, rotation: -2, scale: 1.11 }),
      Object.freeze({ x: 66.0, y: 48.9, dropX: 66.5, dropY: -13, rotation:  4, scale: 1.09 }),
      Object.freeze({ x: 82.5, y: 49.5, dropX: 82.0, dropY: -12, rotation: -5, scale: 1.06 })
    ])
  })
});
