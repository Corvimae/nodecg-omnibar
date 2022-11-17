const BUNDLE_NAME = 'nodecg-omnibar';

function createDefaultReplicantState() {
  return {
    overlayQueue: [],
    carouselQueue: [],
    pendingCarouselDequeues: [],
    activeCarouselItemId: null,
    activeOverlayItemId: null,
    lockedItemId: null,
    requestedNextItemId: null,
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

