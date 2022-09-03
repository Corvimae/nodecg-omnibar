import React from 'react';
import ReactDOM from 'react-dom/client';
import { BUNDLE_NAME } from '../../lib/utils';
import { OmnibarApp } from './OmnibarApp';

function toBundleFilePath(bundleName, filename) {
  return `/bundles/${bundleName}/${filename}`;
}

function addModuleScript(filename) {
  const scriptElem = document.createElement('script');

  scriptElem.src = filename;
  scriptElem.type = 'text/javascript';

  document.body.appendChild(scriptElem);

  console.log('Registered Omnibar factory', filename);
}

function addCSSAsset(filename) {
  const linkElem = document.createElement('link');

  linkElem.href = filename;
  linkElem.type = 'text/css';
  linkElem.rel = 'stylesheet';

  document.head.appendChild(linkElem);
}

const factoryModules = NodeCG.Replicant('nodecg-omnibar-modules', BUNDLE_NAME, {
  defaultValue: [],
  persistent: false,
});

function registerFactory({ bundleName, handlerFileName, cssAssets }) {
  addModuleScript(toBundleFilePath(bundleName, handlerFileName));
  cssAssets.map(asset => toBundleFilePath(bundleName, asset)).forEach(addCSSAsset);
}

NodeCG.waitForReplicants(factoryModules).then(() => {
  factoryModules.value.forEach(registerFactory);
});

nodecg.listenFor('omnibarFactoryRegistered', BUNDLE_NAME, registerFactory);

const root = ReactDOM.createRoot(document.querySelector('#app'));

root.render(
  <React.StrictMode>
    <OmnibarApp />
  </React.StrictMode>
);

