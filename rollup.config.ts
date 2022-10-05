import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';
import { terser } from 'rollup-plugin-terser';

const BANNER = `
// ==UserScript==
// @name         HackerNews Tag User
// @version      0.3
// @description  Add custom tags/flair to a user on HackerNews
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
			processor: css => css.replace(/(?<=[}{;])\s+/gm, ''),

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
