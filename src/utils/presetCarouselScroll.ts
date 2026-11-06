export type PresetTab = 'pose' | 'outfit' | 'scene';

export type PresetScrollPositions = Record<PresetTab, number>;

export function createPresetScrollPositions(): PresetScrollPositions {
  return {
    pose: 0,
    outfit: 0,
    scene: 0,
  };
}

export function getPresetScrollPosition(
  positions: PresetScrollPositions,
  tab: PresetTab,
) {
  return positions[tab];
}

export function updatePresetScrollPosition(
  positions: PresetScrollPositions,
  tab: PresetTab,
  scrollLeft: number,
): PresetScrollPositions {
  return {
    ...positions,
    [tab]: Number.isFinite(scrollLeft) ? Math.max(0, scrollLeft) : 0,
  };
}
