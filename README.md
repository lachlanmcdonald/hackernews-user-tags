# hackernews-user-tags

A [Tampermonkey](https://www.tampermonkey.net/) userscript which adds functionality allowing the user to add a custom coloured label/tag on usernames throughout [Hacker News](https://news.ycombinator.com/). 

## Installation

### Firefox

- Press the **Tampermonkey** extension button on your toolbar and select **Create New Script**
- Copy and paste the contents of `dist/userscript.js` into the newly opened tab and press **Save**

## Usage

Click a user's profile link to display the tagging controls. You can author both a custom label/tag for the user, as well as select a colour for the label.

All data is stored locally.

## Known issues

**Color picker does not automatically close on Firefox**

The `<input type="color">` UI on Firefox is a native UI contorl, and does not always honor changes to the page. There are not yet any known work-arounds.
