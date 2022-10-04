// ==UserScript==
// @name         HackerNews Tag User
// @version      0.1
// @description  Add custom tags/flair to a user on HackerNews
// @author       Lachlan McDonald <lachlan@radelaide.net>
// @match        https://news.ycombinator.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=news.ycombinator.com
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

/*!
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

class TaggingControls {
	constructor() {
		this.tags = new Map();
		this.elements = {};
		this.currentUsername = null;
		this.isOpen = false;
		this.setup();
	}

	load() {
		return GM.getValue(TaggingControls.Key, '{}').then(data => {
			this.tags = new Map(Object.entries(JSON.parse(data)));
		});
	}

	save() {
		const k = Object.fromEntries(this.tags.entries());
		return GM.setValue(TaggingControls.Key, JSON.stringify(k));
	}

	setup() {
		this.load().then(() => {
			this.addStyles();
			this.createControls();
			this.addEventListeners();
			this.applyTags();
		});
	}

	applyTags() {
		Array.from(document.querySelectorAll('a[href^="user?"]:not(#me)')).forEach(e => {
			const u = new URL(e.href);
			const username = u.searchParams.get('id');
			if (this.tags.has(username)) {
				const { label, color } = this.tags.get(username);
				e.dataset.tag = label;
				e.style.setProperty('--bg', color || TaggingControls.DefaultBackground);
				e.classList.add(TaggingControls.CSS_CLASS);
			}
		});
	}

	destroyControls() {
		Object.keys(this.elements).forEach(k => {
			if (k[e] && k[e].remove) {
				k[e].remove();
				k[e] = null;
			}
		});
	}

	createControls() {
		this.destroyControls();

		const controlNode = document.createElement('div');
		const profileNode = document.createElement('a');
		const tagInputNode = document.createElement('input');
		const colorInputNode = document.createElement('input');
		const saveButton = document.createElement('button');
		const closeButton = document.createElement('button');

		controlNode.classList.add(TaggingControls.CSS_CONTROL_CLASS);
		controlNode.setAttribute('aria-hidden', 'true');

		profileNode.textContent = 'View profile';

		colorInputNode.setAttribute('type', 'color');

		tagInputNode.setAttribute('type', 'text');
		tagInputNode.setAttribute('maxlength', '16');

		saveButton.setAttribute('type', 'button');
		saveButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="321.52 316.78 108.97 118.42"><path d="M334.36 378.89a7.106 7.106 0 0 0-9.934-1.504 7.102 7.102 0 0 0-1.503 9.934l33.148 44.988c3.019 4.097 9.246 3.785 11.836-.598l61.566-104.19a7.1 7.1 0 0 0-2.504-9.727 7.103 7.103 0 0 0-9.73 2.5l-56.103 94.941z"></path></svg>';

		closeButton.setAttribute('type', 'button');
		closeButton.innerHTML = '<svg viewBox="256.17 233.43 261.45 261.45" xmlns="http://www.w3.org/2000/svg"><path d="m406.79 364.16 106.08-106.55c5.684-5.684 5.684-14.68 0-19.891-5.684-5.684-14.68-5.684-19.891 0l-106.08 106.56-106.55-106.56c-5.684-5.684-14.68-5.684-19.891 0-5.684 5.684-5.684 14.68 0 19.891l106.08 106.55-106.08 106.56c-5.684 5.684-5.684 14.68 0 19.891 2.84 2.84 6.629 4.262 9.945 4.262 3.317 0 7.106-1.422 9.946-4.262l106.55-106.55 106.55 106.55c2.84 2.84 6.628 4.262 9.945 4.262 3.316 0 7.105-1.422 9.945-4.262 5.684-5.684 5.684-14.68 0-19.891z" fill="#010101"/></svg>';

		controlNode.appendChild(profileNode);
		controlNode.appendChild(tagInputNode);
		controlNode.appendChild(colorInputNode);
		controlNode.appendChild(saveButton);
		controlNode.appendChild(closeButton);

		document.body.appendChild(controlNode);

		this.elements.controlNode = controlNode;
		this.elements.profileNode = profileNode;
		this.elements.tagInputNode = tagInputNode;
		this.elements.colorInputNode = colorInputNode;
		this.elements.saveButton = saveButton;
		this.elements.closeButton = closeButton;
	}

	addStyles() {
		const styleNode = document.createElement('style');
		styleNode.textContent = `.${TaggingControls.CSS_CLASS}::after {
			content: attr(data-tag);
			display: inline-block;
			padding: 1px 4px;
			border-radius: 4px;
			background: var(--bg);
			color: #000;
			margin: 0 0.25rem;
			vertical-align: baseline;
			font-size: 7pt; }`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} {
			z-index: 1000;
			top: var(--top);
			left: var(--left);
			position: absolute;
			background: #000;
			padding: 2px 8px 2px 8px;
			border-radius: 4px;
			box-shadow: 2px 2px #00000038;
			font-size: 7pt;
			display: flex;
			flex-flow: row nowrap;
			gap: 8px;
			align-items: center;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > a {
			color: #FFF;
			text-decoration: none;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > a:hover {
			text-decoration: underline;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS}[aria-hidden=true] {
			display: none;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > input[type="text"] {
			background: #393939;
			color: #FFF;
			font-family: sans-serif;
			font-size: 8pt;
			padding: 4px;
			line-height: 1;
			border: 0;
			appearance: none;
			text-shadow: none;
			display: block;
			width: 170px;
			border-radius: 3px;
			outline: 0;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > input[type="color"] {
			width: 30px;
			outline: 0;
			border: 0;
			background: none;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button {
			display: inline-block;
			cursor: pointer;
			width: 20px;
			height: 20px;
			background: transparent;
			border: 0;
			appearance: none;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button:disabled {
			opacity: 0.2;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button > svg {
			display: block;
			width: 12px;
			height: 12px;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button > svg > path {
			fill: #FFF;
		}`;
		document.querySelector('head').appendChild(styleNode);
	}

	saveTag(username, label, color) {
		if (username) {
			this.tags.set(username, {
				label,
				color,
			});
			this.save().then(() => {
				this.load().then(() => {
					this.applyTags();
				});
			});
		}
	}

	hideControls() {
		this.elements.controlNode.style.setProperty('--top', '');
		this.elements.controlNode.style.setProperty('--left', '');
		this.elements.controlNode.setAttribute('aria-hidden', 'true');
		this.isOpen = false;
	}

	showControls(target) {
		const { left, top, height } = target.getBoundingClientRect();
		const topRounded = (top + height + 8).toFixed(0);
		const leftRounded = left.toFixed(0);
		this.elements.controlNode.style.setProperty('--top', `${topRounded}px`);
		this.elements.controlNode.style.setProperty('--left', `${leftRounded}px`);
		this.elements.controlNode.setAttribute('aria-hidden', 'false');
		this.isOpen = true;
	}

	addEventListeners() {
		// Close button
		this.elements.closeButton.addEventListener('click', (e) => {
			this.hideControls();
			e.preventDefault();
		});

		// Save button
		this.elements.saveButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.hideControls();

			if (this.currentUsername) {
				const label = this.elements.tagInputNode.value.trim();
				const color = this.elements.colorInputNode.value;
				this.saveTag(this.currentUsername, label, color)
			}
		});

		// Handle clicks on
		document.body.addEventListener('click', (e) => {
			if (typeof e.target.href === 'string' && e.target !== this.elements.profileNode) {
				const u = new URL(e.target.href);

				if (u.pathname === '/user' && u.searchParams.has('id')) {
					const username = u.searchParams.get('id');
					const existingLabel = this.tags.has(username) ? this.tags.get(username).label : "";
					const existingColor = this.tags.has(username) ? this.tags.get(username).color || TaggingControls.DefaultBackground : TaggingControls.DefaultBackground;
					e.preventDefault();
					
					// Set 'view profile' link
					this.elements.profileNode.href = e.target.href;
					this.elements.colorInputNode.value = existingColor;

					// Set existing tag
					this.currentUsername = username;
					this.elements.tagInputNode.value = existingLabel;

					// Show controls
					this.showControls(e.target);
				}
			} else if (this.isOpen) {
				let parentNode = e.target;
				let withinControl = false;
				while (parentNode) {
					if (parentNode === this.elements.controlNode) {
						withinControl = true;
					}
					parentNode = parentNode.parentNode;
				}

				if (withinControl === false) {
					this.hideControls();
				}
			}
		});
	}
}

TaggingControls.DefaultBackground = '#d0d0c9';
TaggingControls.Key = 'tm-tags';
TaggingControls.CSS_CLASS = 'tm-tag';
TaggingControls.CSS_CONTROL_CLASS = 'tm-tag__controls';

(function() {
    'use strict';
	new TaggingControls();
})();
