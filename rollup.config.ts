import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';
import { terser } from 'rollup-plugin-terser';

const BANNER = `
// ==UserScript==
// @name         Hacker News User Tags
// @version      0.4
// @description  Allows the user to add a custom coloured label/tag on usernames throughout Hacker News.
// @author       Lachlan McDonald <https://twitter.com/lachlanmcdonald>
// @match        https://news.ycombinator.com/*
// @icon         https://news.ycombinator.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/lachlanmcdonald/hackernews-user-tags/main/dist/userscript.js
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// @license      MIT
// @noframes
// ==/UserScript==`;

export default {
	input: 'src/Userscript.ts',
	output: {
		file: 'dist/userscript.js',
		format: 'iife',
	},
	plugins: [
		scss({
			output: false,
			processor: css => css.replace(/(?<=[}{;])\s+/gum, ''),
		}),
		typescript(),
		terser({
			toplevel: true,
			mangle: false,
			compress: false,
			format: {
				preamble: BANNER.trim(),
			},
		}),
	],
};
