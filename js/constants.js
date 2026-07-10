const CONSTANTS = Object.freeze({
  TREASURE: Object.freeze({
    maxVisibleGems: 10,
    chestAsset: 'assets/treasure/chest.png',
    gemAssets: Object.freeze([
      'assets/gems/Choice-Quest-Gem-Blue.PNG',
      'assets/gems/Choice-Quest-Gem-Yellow.PNG',
      'assets/gems/Choice-Quest-Gem-Green.PNG',
      'assets/gems/Choice-Quest-Gem-Pink.PNG',
      'assets/gems/Choice-Quest-Gem-Red.PNG',
      'assets/gems/Choice-Quest-Gem-Purple.PNG'
    ]),
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
