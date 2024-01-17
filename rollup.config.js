import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';
import terser from '@rollup/plugin-terser';
import fs from 'fs';

const packageJSON = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

const BANNER = `
// ==UserScript==
// @name         Hacker News User Tags
// @version      ${packageJSON.version}
// @description  Allows the user to associate a custom coloured label/tag on usernames throughout Hacker News.
// @author       ${packageJSON.author}
// @match        https://news.ycombinator.com/*
// @icon         https://news.ycombinator.com/favicon.ico
// @updateURL    https://cdn.jsdelivr.net/gh/lachlanmcdonald/hackernews-user-tags@master/dist/userscript.js
// @downloadURL  https://cdn.jsdelivr.net/gh/lachlanmcdonald/hackernews-user-tags@master/dist/userscript.js
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// @license      ${packageJSON.license}
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
