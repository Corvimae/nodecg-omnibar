# nodecg-omnibar

An extensible omnibar for nodecg overlays. Designed for use in speedrunning marathons, but you can use it for whatever!

## Installation

```
nodecg install corvimae/nodecg-omnibar
```

## Usage
Add the `OMNIBAR.HTML` page as a browser source in OBS. Set the page width in OBS to however wide you need it.

**This bundle does not come with any specific functionality. In order to display things in the omnibar, you
need to install additional bundles (see [Creating Omnibar Items](docs/creating-omnibar-items.md)).**

From the dashboard, you can see the currently displayed omnibar item, the ones in queue, and any overlays that are active. You can also lock any omnibar item, and they will stay active when they come up in the queue.

## Creating Omnibar Items
nodecg-omnibar does not come with any specific functionality in order to keep it extensible for any purpose. In order to actually display anything in the omnibar, you need to create your own item bundle or install someone else's.

If you need to make your own item bundle, see [Creating Omnibar Items](docs/creating-omnibar-items.md).