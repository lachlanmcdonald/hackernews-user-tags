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

	static rgbToHex(r: number, g: number, b:number) {
		const k = [r, g, b].map(x => x.toString(16).padStart(2, '0'));
		return `#${k.join()}`;
	}

	static hexToRgb(hex: string) {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(_m: string, r: string, g: string, b:string) {
			return [r, r, g, g, b, b].join('');
		});

		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16),
		} : {
			r: 0,
			g: 0,
			b: 0,
		};
	}

	static luminance(hex: string) {
		const { r, g, b} = TaggingControls.hexToRgb(hex);
		return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
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

				const backgroundColor = color || TaggingControls.DEFAULT_BACKGROUND;
				const textColor = TaggingControls.luminance(backgroundColor) > 0.5 ? '#000' : '#FFF';

				if (typeof label === 'string' && label.length) {
					links.forEach(e => {
						e.dataset.tag = label;
						e.style.setProperty('--bg', backgroundColor);
						e.style.setProperty('--color', textColor);
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
		const profileLink = document.createElement('a');
		const labelInput = document.createElement('input');
		const colorInput = document.createElement('input');
		const saveButton = document.createElement('button');
		const closeButton = document.createElement('button');

		controlNode.classList.add(TaggingControls.CSS_CONTROL_CLASS);

		profileLink.setAttribute('title', 'View Profile');
		profileLink.classList.add('profile');
		profileLink.classList.add('button');

		colorInput.setAttribute('type', 'color');

		labelInput.setAttribute('type', 'text');
		labelInput.setAttribute('placeholder', 'Tag');
		labelInput.setAttribute('maxlength', '16');

		saveButton.setAttribute('type', 'button');
		saveButton.setAttribute('title', 'Save');
		saveButton.classList.add('save');
		saveButton.classList.add('button');

		closeButton.setAttribute('type', 'button');
		closeButton.setAttribute('title', 'Close');
		closeButton.classList.add('close');
		closeButton.classList.add('button');

		const tagInputNodeContainer = document.createElement('div');
		tagInputNodeContainer.appendChild(labelInput);
		const colorInputNodeContainer = document.createElement('div');
		colorInputNodeContainer.appendChild(colorInput);

		controlNode.appendChild(profileLink);
		controlNode.appendChild(tagInputNodeContainer);
		controlNode.appendChild(colorInputNodeContainer);
		controlNode.appendChild(saveButton);
		controlNode.appendChild(closeButton);

		this.elements.containers.controls = controlNode as HTMLDivElement;
		this.elements.links.profile = profileLink as HTMLAnchorElement;
		this.elements.inputs.label = labelInput as HTMLInputElement;
		this.elements.inputs.color = colorInput as HTMLInputElement;
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
			color: var(--color);
			margin: 0 0.25rem;
			vertical-align: baseline;
			font-size: 7pt; }`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} {
			z-index: 1000;
			top: var(--top);
			left: var(--left);
			position: absolute;
			background: #FFF;
			border-radius: 6px;
			box-shadow: 0px 2px 3px #00000038;
			font-size: 9pt;
			display: flex;
			flex-flow: row nowrap;
			align-items: stretch;
			overflow: hidden;
			border: solid 1px #00000038;
			align-content: center;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > a {
			color: #000;
			text-decoration: none;
			display: flex;
			padding: 2px 8px;
			align-items: center;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > a:hover {
			text-decoration: underline;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} input[type="text"] {
			background: var(--bg);
			color: var(--color);
			font-family: inherit;
			font-size: 9pt;
			appearance: none;
			width: 120px;
			outline: 0;
			border: 0;
			border-radius: 6px;
			padding: 5px 8px;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} input[type="color"] {
			width: 38px;
			outline: 0;
			border: 0;
			background: none;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > div {
			display: flex;
			align-items: center;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button {
			display: inline-block;
			cursor: pointer;
			width: 38px;
			height: 38px;
			border: 0;
			padding: 0;
			appearance: none;
			background: transparent;
			background-repeat: no-repeat;
			background-position: center;
			opacity: 0.6;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button:hover {
			opacity: 1.0;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button.profile {
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='176.8 162.88 398.4 426.23'%3E%3Cpath d='M479.4 266.29c0 57.105-46.293 103.4-103.4 103.4-57.102 0-103.39-46.293-103.39-103.4 0-57.102 46.293-103.39 103.39-103.39 57.105 0 103.4 46.293 103.4 103.39'/%3E%3Cpath d='M176.83 537.26c0 69.137 398.34 69.137 398.34 0 0-92.551-89.172-167.58-199.17-167.58s-199.17 75.027-199.17 167.58z' fill='%23000' /%3E%3C/svg%3E%0A");
			background-size: 14px auto;
			margin: 0 4px 0 0;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button.save {
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='195.55 251.68 360.62 248.65'%3E%3Cpath d='M523.8 257.23 325.89 455.14l-98.27-89.98a18.94 18.94 0 0 0-13.723-5.238 18.941 18.941 0 0 0-11.852 33.18l111.62 102.25a18.941 18.941 0 0 0 26.187-.567l210.74-210.74v-.004a18.95 18.95 0 0 0 4.907-18.309 18.95 18.95 0 0 0-13.402-13.402 18.962 18.962 0 0 0-18.31 4.906z' fill='%23000' /%3E%3C/svg%3E%0A");
			background-size: 16px auto;
			margin: 0 0 0 4px;
		}`;
		styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button.close {
			background-image: url("data:image/svg+xml,%3Csvg viewBox='256.17 233.43 261.45 261.45' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m406.79 364.16 106.08-106.55c5.684-5.684 5.684-14.68 0-19.891-5.684-5.684-14.68-5.684-19.891 0l-106.08 106.56-106.55-106.56c-5.684-5.684-14.68-5.684-19.891 0-5.684 5.684-5.684 14.68 0 19.891l106.08 106.55-106.08 106.56c-5.684 5.684-5.684 14.68 0 19.891 2.84 2.84 6.629 4.262 9.945 4.262 3.317 0 7.106-1.422 9.946-4.262l106.55-106.55 106.55 106.55c2.84 2.84 6.628 4.262 9.945 4.262 3.316 0 7.105-1.422 9.945-4.262 5.684-5.684 5.684-14.68 0-19.891z' fill='%23000'/%3E%3C/svg%3E");
			background-size: 14px auto;
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
		if (this.elements.containers.controls.parentElement) {
			this.elements.containers.controls = this.elements.containers.controls.parentElement.removeChild(this.elements.containers.controls);
		}

		this.isOpen = false;
	}

	showControls(target: HTMLElement) {
		const { left, top, height } = target.getBoundingClientRect();
		const topRounded = (top + height + window.scrollX).toFixed(0);
		const leftRounded = (left + window.scrollY).toFixed(0);
		this.elements.containers.controls.style.setProperty('--top', `${topRounded}px`);
		this.elements.containers.controls.style.setProperty('--left', `${leftRounded}px`);
		document.body.appendChild(this.elements.containers.controls);
		this.isOpen = true;
	}

	updateControlInput(backgroundColor: string) {
		const textColor = TaggingControls.luminance(backgroundColor) > 0.5 ? '#000' : '#FFF';
		this.elements.inputs.label.style.setProperty('--bg', backgroundColor);
		this.elements.inputs.label.style.setProperty('--color', textColor);
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

		// Update input CSS variables whenever the color input changes value
		this.elements.inputs.color.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			this.updateControlInput(target.value);
		});

		// Listen to all clicks which bubble up to the body
		// and process those which are only a profile <a> tag.
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
						this.updateControlInput(existingColor);

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
