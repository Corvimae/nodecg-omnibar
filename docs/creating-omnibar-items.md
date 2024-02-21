# Creating Omnibar Items

It's recommended you use the [template](https://github.com/corvimae/nodecg-omnibar-item-template) and expand from there. It'll save you the headache of setting up the package correctly.

## Concepts

Omnibar items have two parts:
1. The server-side logic that registers the bundle, enqueues new omnibar items when they're relevant,
and dequeues existing omnibar items when they're no longer needed.
2. The visual element that appears inside the omnibar itself.

For simplicity, this guide refers to (1) as the **extension script** and (2) as the **front-end script**.

## Setup

1. Create a new bundle as per any other nodecg bundle.
1. Add an `extension.js` file at the root level. This is the extension script.
1. Add an `omnibar-item.js` file somewhere in your workspace. If you're not planning on using libaries
like React that necessitate build tools, I recommend placing this file at `src/omnibar-item.js`.
1. Create a `css` directory and make a new file named `omnibar-item.css` within it.
front-end script is in, and another for the `css` directory.
1. Run `npm install nodecg-omnibar` or `yarn add nodecg-omnibar`.
1. Run `npm install react` or `yarn add react`. You have to use React. Sorry!
1. Run `npm install parcel --save-dev` or `yarn add parcel --dev`.
1. In `package.json`, add a [mount directory](https://www.nodecg.dev/docs/mounts) for whatever directory your item's 
1. In `package.json`, add the following:
```
"source": "src/omnibar-item.js",
"context": "browser",
"outputFormat": "commonjs",
"distDir": "dist",
"scripts": {
  "watch": "npx parcel watch",
  "build": "npx parcel build"
},
```
1. Run `npm run watch` or `yarn watch`.

## Extension Script

### Registering the Item Factory
In your extension script file (`extension.js`), import the OmnibarInterface class and create a new instance.

```js
const { OmnibarInterface } = require('nodecg-omnibar');

module.exports = nodecg => {
  const omnibar = new OmnibarInterface(nodecg);
}
```

In order for the omnibar to properly render items, you need to register the bundle using `OmnnibarInterface#registerItemType(bundleName, itemType, displayString, options?)`.

```js
omnibar.registerItemType('omnibar-breaking-news', 'Breaking news: {{message}}', {
  cssAssets: ['css/omnibar-item.css'],
});
```

`bundleType` **must match the nodecg bundle**.

`itemType` is a unique name for this item type.

`displayString` is the text that will appear on the dashboard in the visual queue for this item type.
You can use handlebars-templated strings with any data you provide to an item when you enqueue it
(more on this in a bit).

`options` is not required, but provides additional customization for the item type:
- `handlerFileName` (string): If your front-end script file is not at `dist/omnibar-item.js`, specify the path with this.
- `cssAssets` (array of strings): Any CSS files to load alongside the front-end script file.

### Enqueueing a Carousel Item
With the item type registered, you can enqueue elements into the omnibar carousel whenever you need using
`OmnibarInterface#enqueueCarouselItem(itemType, data, options?)`

```js
omnibar.enqueueCarouselItem('breaking-news', { message: 'Hello! :)' });
```

The new carousel item is inserted at the end of the queue, and you should immediately see it in the dashboard.

`itemType` is the unique name for the item type you wish to create an instance of.

`data` can be anything; nodecg-omnibar does not use this data, but passes it along to your front-end script.

`options` is not required, but provides additional customization for this carousel item instance:
- `duration` (number, default: `5000`) - The length of time, in milliseconds, that the carousel item is 
shown before it is rotated out. This does not include the transition between cards.
`containerClass` (string) - A CSS class to apply to the container element if you need to style it.

`enqueueOverlay` returns a promise containing the configuration data for the carousel item. Importantly, 
this isthe only way to get the ID of the enqueued carousel item, which is required to dequeue it, so 
make sure to save the return value!

### Dequeueing a Carousel Item

When you want to remove an carousel item from the queue, use `OmnibarInterface#dequeueCarouselItem(id)`.

### Enqueueing Overlays

Overlays work like carousel items except they are immediately shown above all other content in the omnibar
(unless there is already a visible overlay, in which case it will be enqueued and shown as soon as
possible).

Any item can be used as an overlay (though I recommend making separate item types for your overlays).
Unlike carousel cards, overlays do not have any animations on enter and exit; you need to implement
whatever entrance and exit visuals you want for your overlays yourself.

Enqueue an overlay with `OmnibarInterface#enqueueOverlay(itemType, data, options?)`.

Overlays cannot be dequeued; they are automatically removed from the queue once they are shown.

## Front-end Script

In your front-end script file (default: `dist/omnibar-item.js`), call `registerOmnibarItem(typeName, factoryMethod)`.

```js
registerOmnibarItem('breaking-news', ({ data }) => {
  return `Breaking news!!!! ${data.message}`.
});
```

The `typeName` argument must match an item type that was registered using `registerItemType`.

The `factoryMethod` argument is a React function component (it takes in props, and returns a React element).

The component receives these props:

- `id` - The ID of the carousel item or overlay.
- `data` - The data specified when creating the item with `enqueueOverlay`.
- `isLocked` - Is this carousel item currently locked? (always false for overlays)
- `isActive` - Is this carousel item or overlay active? (A carousel item that is covered by an overlay is still considered active, even if the overlay fully conceals it).
- `isTransitioning` - Is this carousel item currently cycling on or off? (always false for overlays).
- `isOverlay` - Is this item an overlay?
