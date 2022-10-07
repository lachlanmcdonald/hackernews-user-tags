# Hacker News User Tags

**Hacker News User Tags** is a [Tampermonkey](https://www.tampermonkey.net/) userscript which allows the user to associate a custom coloured label/tag on usernames throughout [Hacker News](https://news.ycombinator.com/).

## Installation

1. Press the **Tampermonkey** extension button on your browser's toolbar and select **Create New Script**
2. Copy and paste the contents of [`dist/userscript.js`](https://raw.githubusercontent.com/lachlanmcdonald/hackernews-user-tags/main/dist/userscript.js) into the newly opened tab and press **Save**

## Usage

Click a user's profile link to display the tagging controls. You can author both a custom label/tag for the user, as well as select a colour for the label.

All data is stored locally.

## Known issues

**Color picker does not automatically close on Firefox**

The `<input type="color">` element in Firefox uses device-native UI controls, which does not always honor changes to the page. There are not any known work-arounds, and the color picker will need to be closed manually.
