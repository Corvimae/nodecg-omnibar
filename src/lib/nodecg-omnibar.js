import { BUNDLE_NAME, createDefaultReplicantState } from './utils';

export class OmnibarInterface {
  constructor(nodecg) {
    this.nodecg = nodecg;
    this.replicant = nodecg.Replicant('nodecg-omnibar', BUNDLE_NAME, {
      defaultValue: createDefaultReplicantState(),
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
    this.nodecg.sendMessageToBundle('enqueueCarouselItem', BUNDLE_NAME, {
      itemType,
      config,
      options,
    });

    return await this.waitForAck('enqueueCarouselItemAck');
  }

  dequeueCarouselItem(id) {
    this.nodecg.sendMessageToBundle('dequeueCarouselItem', BUNDLE_NAME, { id });
  }

  async enqueueOverlay(itemType, config, options = {}) {
    this.nodecg.sendMessageToBundle('enqueueOverlay', BUNDLE_NAME, {
      itemType,
      config,
      options,
    });

    return await this.waitForAck('enqueueOverlayAck');
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