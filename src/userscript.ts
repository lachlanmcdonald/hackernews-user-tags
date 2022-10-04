// ==UserScript==
// @name         HackerNews Tag User
// @version      0.1
// @description  Add custom tags/flair to a user on HackerNews
// @author       Lachlan McDonald <https://twitter.com/lachlanmcdonald>
// @match        https://news.ycombinator.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=news.ycombinator.com
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// @license      MIT
// @noframes
// ==/UserScript==

//=require ./TaggingControls.ts

(function() {
	"use strict";
	new TaggingControls(); // eslint-disable-line no-undef
})();