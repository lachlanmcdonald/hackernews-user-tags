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
class TaggingControls {
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
        const links = Array.from(document.querySelectorAll('a[href^="user?"]'));
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
        }, {});
        Object.entries(usernames).forEach(([username, links]) => {
            if (this.tags.has(username)) {
                const { label, color } = this.tags.get(username);
                if (typeof label === 'string' && label.length) {
                    links.forEach(e => {
                        e.dataset.tag = label;
                        e.style.setProperty('--bg', color || TaggingControls.DEFAULT_BACKGROUND);
                        e.classList.add(TaggingControls.CSS_CLASS);
                    });
                }
                else {
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
        saveButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="321.52 316.78 108.97 118.42"><path d="M334.36 378.89a7.106 7.106 0 0 0-9.934-1.504 7.102 7.102 0 0 0-1.503 9.934l33.148 44.988c3.019 4.097 9.246 3.785 11.836-.598l61.566-104.19a7.1 7.1 0 0 0-2.504-9.727 7.103 7.103 0 0 0-9.73 2.5l-56.103 94.941z"></path></svg>';
        closeButton.setAttribute('type', 'button');
        closeButton.innerHTML = '<svg viewBox="256.17 233.43 261.45 261.45" xmlns="http://www.w3.org/2000/svg"><path d="m406.79 364.16 106.08-106.55c5.684-5.684 5.684-14.68 0-19.891-5.684-5.684-14.68-5.684-19.891 0l-106.08 106.56-106.55-106.56c-5.684-5.684-14.68-5.684-19.891 0-5.684 5.684-5.684 14.68 0 19.891l106.08 106.55-106.08 106.56c-5.684 5.684-5.684 14.68 0 19.891 2.84 2.84 6.629 4.262 9.945 4.262 3.317 0 7.106-1.422 9.946-4.262l106.55-106.55 106.55 106.55c2.84 2.84 6.628 4.262 9.945 4.262 3.316 0 7.105-1.422 9.945-4.262 5.684-5.684 5.684-14.68 0-19.891z" fill="#010101"/></svg>';
        controlNode.appendChild(profileNode);
        controlNode.appendChild(tagInputNode);
        controlNode.appendChild(colorInputNode);
        controlNode.appendChild(saveButton);
        controlNode.appendChild(closeButton);
        document.body.appendChild(controlNode);
        this.elements.containers.controls = controlNode;
        this.elements.links.profile = profileNode;
        this.elements.inputs.label = tagInputNode;
        this.elements.inputs.color = colorInputNode;
        this.elements.button.save = saveButton;
        this.elements.button.close = closeButton;
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
    showControls(target) {
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
                this.saveTag(this.currentUsername, label, color);
            }
        });
        // Handle clicks on
        document.body.addEventListener('click', (e) => {
            if (e.target instanceof HTMLAnchorElement && typeof e.target.href === 'string' && e.target !== this.elements.links.profile) {
                const u = new URL(e.target.href);
                if (u.pathname === '/user' && u.searchParams.has('id')) {
                    const username = u.searchParams.get('id');
                    if (typeof username === 'string' && username !== this.ownUsername) {
                        const existingLabel = this.tags.has(username) ? this.tags.get(username).label || "" : "";
                        const existingColor = this.tags.has(username) ? this.tags.get(username).color || TaggingControls.DEFAULT_BACKGROUND : TaggingControls.DEFAULT_BACKGROUND;
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
            }
            else if (this.isOpen) {
                let parentNode = e.target;
                let withinControl = false;
                while (parentNode) {
                    if (parentNode === this.elements.containers.controls) {
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
TaggingControls.DEFAULT_BACKGROUND = '#d0d0c9';
TaggingControls.GM_KEY = 'tm-tags';
TaggingControls.CSS_CLASS = 'tm-tag';
TaggingControls.CSS_CONTROL_CLASS = 'tm-tag__controls';
(function () {
    "use strict";
    new TaggingControls(); })();
