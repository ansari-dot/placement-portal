export const PLACEMENT_DATA_CHANGED = 'placement-data-changed';

export const notifyPlacementDataChanged = () => {
  window.dispatchEvent(new Event(PLACEMENT_DATA_CHANGED));
};
