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
    slots: Object.freeze([
      Object.freeze({ x: 30, y: 41.5, dropX: 28, dropY: -14, rotation: -5, scale: 0.95 }),
      Object.freeze({ x: 48, y: 40.8, dropX: 47, dropY: -15, rotation: 3, scale: 0.94 }),
      Object.freeze({ x: 67, y: 41.3, dropX: 69, dropY: -13, rotation: -4, scale: 0.95 }),

      Object.freeze({ x: 22, y: 46.8, dropX: 21, dropY: -13, rotation: 4, scale: 1.02 }),
      Object.freeze({ x: 40, y: 46.0, dropX: 41, dropY: -14, rotation: -6, scale: 1.03 }),
      Object.freeze({ x: 58, y: 46.5, dropX: 57, dropY: -15, rotation: 2, scale: 1.01 }),
      Object.freeze({ x: 76, y: 46.2, dropX: 77, dropY: -13, rotation: 5, scale: 1.02 }),

      Object.freeze({ x: 16, y: 52.0, dropX: 16, dropY: -12, rotation: -3, scale: 1.15 }),
      Object.freeze({ x: 33, y: 51.2, dropX: 34, dropY: -14, rotation: 5, scale: 1.15 }),
      Object.freeze({ x: 50, y: 52.5, dropX: 49, dropY: -13, rotation: -5, scale: 1.14 }),
      Object.freeze({ x: 67, y: 51.6, dropX: 68, dropY: -15, rotation: 4, scale: 1.15 }),
      Object.freeze({ x: 83, y: 52.3, dropX: 82, dropY: -12, rotation: -2, scale: 1.14 })
    ])    ]),
    slots: Object.freeze([
      Object.freeze({ x: 18, y: 37.0, dropX: 18, dropY: -13, rotation: -6, scale: 0.76 }),
      Object.freeze({ x: 30, y: 36.2, dropX: 29, dropY: -15, rotation:  4, scale: 0.78 }),
      Object.freeze({ x: 42, y: 37.4, dropX: 43, dropY: -14, rotation: -3, scale: 0.80 }),
      Object.freeze({ x: 54, y: 36.4, dropX: 54, dropY: -16, rotation:  5, scale: 0.78 }),
      Object.freeze({ x: 66, y: 37.2, dropX: 65, dropY: -14, rotation: -5, scale: 0.79 }),
      Object.freeze({ x: 78, y: 36.5, dropX: 79, dropY: -13, rotation:  6, scale: 0.76 }),
      Object.freeze({ x: 25, y: 40.7, dropX: 24, dropY: -12, rotation:  5, scale: 0.88 }),
      Object.freeze({ x: 41, y: 40.2, dropX: 42, dropY: -15, rotation: -4, scale: 0.91 }),
      Object.freeze({ x: 57, y: 40.5, dropX: 57, dropY: -13, rotation:  3, scale: 0.90 }),
      Object.freeze({ x: 73, y: 40.3, dropX: 74, dropY: -14, rotation: -5, scale: 0.87 })
    ])
  })
});
