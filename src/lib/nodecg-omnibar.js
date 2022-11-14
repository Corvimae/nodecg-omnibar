import { BUNDLE_NAME, createDefaultReplicantState } from './utils';
import { v4 as uuid } from 'uuid';

export class OmnibarInterface {
  constructor(nodecg) {
    this.nodecg = nodecg;
    this.replicant = nodecg.Replicant('nodecg-omnibar', BUNDLE_NAME, {
      defaultValue: createDefaultReplicantState(),
      persistent: false,
    });

    this.factoryModules = nodecg.Replicant('nodecg-omnibar-modules', BUNDLE_NAME, {
      defaultValue: [],
      persistent: false,
    });
  }

  registerItemType(bundleName, itemType, displayString, options = {}) {
    const handlerFileName = options.handlerFileName || 'dist/omnibar-item.js';
    const cssAssets = options.cssAssets || [];

    const bundleData = {
      bundleName,
      itemType,
      displayString,
      handlerFileName,
      cssAssets,
    };

    this.factoryModules.value = [...this.factoryModules.value, bundleData];

    this.nodecg.sendMessageToBundle('omnibarFactoryRegistered', BUNDLE_NAME, bundleData);
  };
  async enqueueCarouselItem(itemType, config, options = {}) {
    const requestId = uuid();
    this.nodecg.sendMessageToBundle('enqueueCarouselItem', BUNDLE_NAME, {
      requestId,
      itemType,
      config,
      options,
    });

    return await this.waitForAck(`enqueueCarouselItemAck-${requestId}`);
  }

  dequeueCarouselItem(id) {
    this.nodecg.sendMessageToBundle('dequeueCarouselItem', BUNDLE_NAME, { id });
  }

  async enqueueOverlay(itemType, config, options = {}) {
    const requestId = uuid();
    this.nodecg.sendMessageToBundle('enqueueOverlay', BUNDLE_NAME, {
      requestId,
      itemType,
      config,
      options,
    });

    return await this.waitForAck(`enqueueOverlayAck-${requestId}`);
  }

  waitForAck(ackEventName) {
    return new Promise((resolve) => {
      let response = null;

      const responseListener = resp => {
        response = resp;
      };
      
      const intervalId = setInterval(() => {
        if (response) {
          clearInterval(intervalId);
          this.nodecg.unlisten(ackEventName, BUNDLE_NAME, responseListener);
          
          resolve(response);
        }
      }, 0);

      this.nodecg.listenFor(ackEventName, BUNDLE_NAME, responseListener);
    });
  }
}

global.omnibar = OmnibarInterface;