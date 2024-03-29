/* eslint-env es2019, browser */
/* global GM */

/*
 * MIT License
 *
 * Copyright (c) 2022 Lachlan McDonald <https://twitter.com/lachlanmcdonald>
 * https://github.com/lachlanmcdonald/hackernews-user-tags/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import TaggingControls from './TaggingControls';

export default class TamperMonkeyTaggingControls extends TaggingControls {
	async load() {
		const data = await GM.getValue(TaggingControls.GM_KEY, '{}');

		this.tags = new Map(Object.entries(JSON.parse(data)));
	}

	async save() {
		// Attempt to haphazardly merge existing data with the new data to avoid a
		// situation where the userscript, running across multiple tabs, overwrites eachother.
		const existingData = await GM.getValue(TaggingControls.GM_KEY, '{}');

		const data = {
			...JSON.parse(existingData),
			...Object.fromEntries(this.tags.entries()),
		};

		await GM.setValue(TaggingControls.GM_KEY, JSON.stringify(data));

		this.tags = new Map(Object.entries(data));
	}
}
