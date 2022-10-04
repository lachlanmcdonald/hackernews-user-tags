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

interface ElementMap {
	containers: { [key: string]: HTMLDivElement},
	links: { [key: string]: HTMLAnchorElement},
	inputs: { [key: string]: HTMLInputElement},
	button: { [key: string]: HTMLButtonElement},
}

interface UserTag {
	label: string | null,
	color: string | null,
}

interface AnchorElementUsernameMap {
	[key: string]: Array<HTMLAnchorElement>
}

export default class TaggingControls {
	tags: Map<string,UserTag>;
	elements: ElementMap;
	currentUsername: string|null;
	isOpen: boolean;
	ownUsername: string|null;

	static DEFAULT_BACKGROUND = '#d0d0c9';
	static GM_KEY = 'tm-tags';
	static CSS_CLASS = 'tm-tag';
	static CSS_CONTROL_CLASS = 'tm-tag__controls';

	constructor() {
		this.tags = new Map();
		this.elements = {
			containers: {},
			links: {},
			inputs: {},
			button: {},
		};
		this.currentUsername = null;
		this.isOpen = false;
		this.ownUsername = null;
		this.setup();
	}

	load() {
		return GM.getValue(TaggingControls.GM_KEY, '{}').then(data => {
			this.tags = new Map(Object.entries(JSON.parse(data)));
		});
	}

	save() {
		const k = Object.fromEntries(this.tags.entries());
		return GM.setValue(TaggingControls.GM_KEY, JSON.stringify(k));
	}

	setup() {
		const ownProfileLink = document.getElementById('me');
		this.ownUsername = ownProfileLink ? (ownProfileLink.textContent || "").trim() : null;

		this.load().then(() => {
			this.addStyles();
			this.createControls();
			this.addEventListeners();
			this.applyTags();
		});
	}

	applyTags() {
		const links = Array.from(document.querySelectorAll('a[href^="user?"]')) as Array<HTMLAnchorElement>;

		const usernames = links.reduce((temp, link) => {
			const u = new URL(link.href);
			const username = u.searchParams.get('id');

			if (username !== null) {
				if (Object.prototype.hasOwnProperty.call(temp, username) === false) {
					temp[username] = [];
				}
				temp[username].push(link);
			}

			return temp;
		}, {} as AnchorElementUsernameMap);

		Object.entries(usernames).forEach(([username, links]) => {
			if (this.tags.has(username)) {
				const { label, color } = this.tags.get(username) as UserTag;

				if (typeof label === 'string' && label.length) {
					links.forEach(e => {
						e.dataset.tag = label;
						e.style.setProperty('--bg', color || TaggingControls.DEFAULT_BACKGROUND);
						e.classList.add(TaggingControls.CSS_CLASS);
					});
				} else {
					links.forEach(e => {
						e.classList.remove(TaggingControls.CSS_CLASS);
					});
				}
			}
		});
	}

	createControls() {
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
		saveButton.classList.add('save');

		closeButton.setAttribute('type', 'button');
		closeButton.classList.add('close');

		controlNode.appendChild(profileNode);
		controlNode.appendChild(tagInputNode);
		controlNode.appendChild(colorInputNode);
		controlNode.appendChild(saveButton);
		controlNode.appendChild(closeButton);

		document.body.appendChild(controlNode);

		this.elements.containers.controls = controlNode as HTMLDivElement;
		this.elements.links.profile = profileNode as HTMLAnchorElement;
		this.elements.inputs.label = tagInputNode as HTMLInputElement;
		this.elements.inputs.color = colorInputNode as HTMLInputElement;
		this.elements.button.save = saveButton as HTMLButtonElement;
		this.elements.button.close = closeButton as HTMLButtonElement;
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
			background: #666;
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
			border: 0;
			appearance: none;
			background: transparent;
			background-size: 14px auto;
			background-repeat: no-repeat;
			background-position: center;
			opacity: 0.5;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button:hover {
			opacity: 1.0;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button.save {
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='321.52 316.78 108.97 118.42'%3E%3Cpath d='M334.36 378.89a7.106 7.106 0 0 0-9.934-1.504 7.102 7.102 0 0 0-1.503 9.934l33.148 44.988c3.019 4.097 9.246 3.785 11.836-.598l61.566-104.19a7.1 7.1 0 0 0-2.504-9.727 7.103 7.103 0 0 0-9.73 2.5l-56.103 94.941z' fill='%23FFF'%3E%3C/path%3E%3C/svg%3E");
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button.close {
			background-image: url("data:image/svg+xml,%3Csvg viewBox='256.17 233.43 261.45 261.45' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m406.79 364.16 106.08-106.55c5.684-5.684 5.684-14.68 0-19.891-5.684-5.684-14.68-5.684-19.891 0l-106.08 106.56-106.55-106.56c-5.684-5.684-14.68-5.684-19.891 0-5.684 5.684-5.684 14.68 0 19.891l106.08 106.55-106.08 106.56c-5.684 5.684-5.684 14.68 0 19.891 2.84 2.84 6.629 4.262 9.945 4.262 3.317 0 7.106-1.422 9.946-4.262l106.55-106.55 106.55 106.55c2.84 2.84 6.628 4.262 9.945 4.262 3.316 0 7.105-1.422 9.945-4.262 5.684-5.684 5.684-14.68 0-19.891z' fill='%23FFF'/%3E%3C/svg%3E");
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > button:disabled {
			opacity: 0.2;
		}`;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		document.querySelector('head')!.appendChild(styleNode);
	}

	saveTag(username: string, label: string|null, color: string|null) {
		if (username) {
			this.tags.set(username, {
				label: label === "" ? null : label,
				color: color === "" ? null : color,
			});

			this.save().then(() => {
				this.load().then(() => {
					this.applyTags();
				});
			});
		}
	}

	hideControls() {
		this.elements.containers.controls.style.setProperty('--top', '');
		this.elements.containers.controls.style.setProperty('--left', '');
		this.elements.containers.controls.setAttribute('aria-hidden', 'true');
		this.isOpen = false;
	}

	showControls(target: HTMLElement) {
		const { left, top, height } = target.getBoundingClientRect();
		const topRounded = (top + height + 8).toFixed(0);
		const leftRounded = left.toFixed(0);
		this.elements.containers.controls.style.setProperty('--top', `${topRounded}px`);
		this.elements.containers.controls.style.setProperty('--left', `${leftRounded}px`);
		this.elements.containers.controls.setAttribute('aria-hidden', 'false');
		this.isOpen = true;
	}

	addEventListeners() {
		// Close button
		this.elements.button.close.addEventListener('click', (e) => {
			this.hideControls();
			e.preventDefault();
		});

		// Save button
		this.elements.button.save.addEventListener('click', (e) => {
			e.preventDefault();
			this.hideControls();

			if (this.currentUsername) {
				const label = this.elements.inputs.label.value.trim();
				const color = this.elements.inputs.color.value;
				this.saveTag(this.currentUsername, label, color)
			}
		});

		// Handle clicks on
		document.body.addEventListener('click', (e) => {
			if (e.target instanceof HTMLAnchorElement && typeof e.target.href === 'string' && e.target !== this.elements.links.profile) {
				const u = new URL(e.target.href);

				if (u.pathname === '/user' && u.searchParams.has('id')) {
					const username = u.searchParams.get('id');

					if (typeof username === 'string' && username !== this.ownUsername) {
						const existingLabel = this.tags.has(username) ? (this.tags.get(username) as UserTag).label || "" : "";
						const existingColor = this.tags.has(username) ? (this.tags.get(username) as UserTag).color || TaggingControls.DEFAULT_BACKGROUND : TaggingControls.DEFAULT_BACKGROUND;
						e.preventDefault();

						// Set 'view profile' link
						this.elements.links.profile.href = e.target.href;
						this.elements.inputs.color.value = existingColor;

						// Set existing tag
						this.currentUsername = username;
						this.elements.inputs.label.value = existingLabel;

						// Show controls
						this.showControls(e.target);
					}
				}
			} else if (this.isOpen) {
				let parentNode = e.target as Node;
				let withinControl = false;

				while (parentNode) {
					if (parentNode === this.elements.containers.controls) {
						withinControl = true;
					}
					parentNode = parentNode.parentNode as Node;
				}

				if (withinControl === false) {
					this.hideControls();
				}
			}
		});
	}
}
