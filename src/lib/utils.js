const BUNDLE_NAME = 'nodecg-omnibar';

function createDefaultReplicantState() {
  return {
    overlayQueue: [],
    carouselQueue: [],
    pendingCarouselDequeues: [],
    activeCarouselItemId: null,
    activeOverlayItemId: null,
    lockedItemId: null,
  };
}

module.exports = {
  BUNDLE_NAME,
  createDefaultReplicantState
};