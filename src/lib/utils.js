const BUNDLE_NAME = 'nodecg-omnibar';

function createDefaultReplicantState(nodecg) {
  return {
    overlayQueue: [],
    carouselQueue: [],
    pendingCarouselDequeues: [],
    activeCarouselItemId: null,
    activeOverlayItemId: null,
    lockedItemId: null,
    requestedNextItemId: null,
    nextTransitionTime: Date.now(),
    activeCarouselItemDuration: 5000,
    height: nodecg?.bundleConfig.height ?? 80,
  };
}

function findLastIndex(array, predicate) {
  let l = array.length;

  while (l--) {
    if (predicate(array[l], l, array)) return l;
  }
  return -1;
}

module.exports = {
  BUNDLE_NAME,
  createDefaultReplicantState,
  findLastIndex,
};

