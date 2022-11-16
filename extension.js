const { BUNDLE_NAME, createDefaultReplicantState, findLastIndex } = require('./src/lib/utils');
const { v4: uuid } = require('uuid');

const MAIN_LOOP_INTERVAL = 1000;

module.exports = nodecg => {
  const state = nodecg.Replicant('nodecg-omnibar', BUNDLE_NAME, {
    defaultValue: createDefaultReplicantState(),
    persistent: false,
  });

  let transitionTimeoutId = null;

  function getActiveItem() {
    return state.value.carouselQueue.find(({ id }) => id === state.value.activeCarouselItemId);
  }

  function getActiveItemIndex() {
    return state.value.carouselQueue.findIndex(({ id }) => id === state.value.activeCarouselItemId);
  }

  function getNextActiveItem() {
    const currentIndex = getActiveItemIndex();

    if (currentIndex === -1 || currentIndex === state.value.carouselQueue.length - 1) {
      return state.value.carouselQueue[0];
    } else {
      return state.value.carouselQueue[currentIndex + 1];
    }
  }

  function getItem(id) {
    return state.value.carouselQueue.find(item => item.id === id);
  }

  function scheduleNextTransition() {
    const currentItem = getActiveItem();

    const duration = currentItem ? currentItem.duration : 5000;

    if (transitionTimeoutId) clearTimeout(transitionTimeoutId);
    transitionTimeoutId = setTimeout(transitionBetweenItems, duration);
  }

  function transitionBetweenItems() {
    if (state.value.lockedItemId !== null && state.value.lockedItemId === state.value.activeCarouselItemId) {
      scheduleNextTransition(); 
      
      return;
    }
    
    if (state.value.carouselQueue.length < 2) {
      scheduleNextTransition();
      
      return;
    }

    const nextItem = getNextActiveItem();

    state.value = {
      ...state.value,
      activeCarouselItemId: nextItem.id,
    };

    nodecg.sendMessageToBundle('transitionBetweenItems', BUNDLE_NAME);

    scheduleNextTransition();
  }

  function createItemData(data) {
    return {
      id: uuid(),
      type: data.itemType,
      data: data.config,
      duration: data.options.duration || 5000,
      containerClass: data.options.containerClass || '',
    };
    
  }

  nodecg.listenFor('lockItem', data => {
    const item = getItem(data.id);

    if (!item) {
      console.error(`Unable to lock item ${data.id} - item not found.`);
      
      return;
    }

    const isUnlocking = state.value.lockedItemId === item.id

    state.value = {
      ...state.value,
      lockedItemId: isUnlocking ? null : item.id,
    };
  });

  nodecg.listenFor('prioritizeItem', data => {
    const item = getItem(data.id);
    const restOfQueue = state.value.carouselQueue.filter(({ id }) => id !== item.id);

    state.value = {
      ...state.value,
      carouselQueue: [
        restOfQueue[0],
        item,
        ...restOfQueue.slice(1),
      ],
    };

    nodecg.sendMessageToBundle('updateActiveQueue', BUNDLE_NAME);
  });

  nodecg.listenFor('enqueueCarouselItem', data => {
    const itemData = createItemData(data);

    console.log('new', itemData.id);

    let goalIndex = state.value.carouselQueue.length;

    if (data.options.autoGroup) {
      const lastIndex = findLastIndex(state.value.carouselQueue, item => item.type === data.itemType);

      if (lastIndex !== -1) goalIndex = lastIndex + 1;
    }

    state.value = {
      ...state.value,
      carouselQueue: [
        ...state.value.carouselQueue.slice(0, goalIndex),
        itemData,
        ...state.value.carouselQueue.slice(goalIndex),
      ],
    };
  
    nodecg.sendMessageToBundle(`enqueueCarouselItemAck-${data.requestId}`, BUNDLE_NAME, itemData);

    if (state.value.activeCarouselItemId === null) transitionBetweenItems();
  });

  nodecg.listenFor('dequeueCarouselItem', data => {
    state.value.pendingCarouselDequeues.push(data.id);
  });

  nodecg.listenFor('enqueueOverlay', data => {
    const itemData = createItemData(data);

    state.value = {
      ...state.value,
      overlayQueue: [...state.value.overlayQueue, itemData],
    };
  
    nodecg.sendMessageToBundle(`enqueueOverlayAck-${data.requestId}`, BUNDLE_NAME, itemData);
  });
  
  setInterval(() => {
    const nextActiveItem = getNextActiveItem();

    state.value.pendingCarouselDequeues = state.value.pendingCarouselDequeues.reduce((acc, id) => {
      const item = getItem(id);

      if (!item) return acc;

      if (item.id === state.value.activeCarouselItemId) {
        // Do not dequeue in case this is currently animated
        return [...acc, id];
      } else if (item.id === nextActiveItem.id && state.value.carouselQueue.length > 2) {
        // Do not dequeue in case this is currently animated, unless we don't really have a choice.
        return [...acc, id];
      } else {
        state.value.carouselQueue = state.value.carouselQueue.filter(item => item.id !== id);

        return acc;
      }
    }, []);

    if (state.value.overlayQueue.length > 0 && state.value.activeOverlayItemId === null) {
      // Enqueue the next overlay.
      console.info(`Playing overlay ${state.value.overlayQueue[0].type}.`);

      state.value = {
        ...state.value,
        activeOverlayItemId: state.value.overlayQueue[0].id,
      };

      setTimeout(() => {
        console.info(`Removing overlay ${state.value.overlayQueue[0].type}.`);

        state.value = {
          ...state.value,
          activeOverlayItemId: null,
          overlayQueue: state.value.overlayQueue.slice(1),
        };
      }, state.value.overlayQueue[0].duration + 250);
    }
  }, MAIN_LOOP_INTERVAL);
}