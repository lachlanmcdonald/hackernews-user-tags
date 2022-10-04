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
    static rgbToHex(r, g, b) {
        const k = [r, g, b].map(x => x.toString(16).padStart(2, '0'));
        return `#${k.join()}`;
    }
    static hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (_m, r, g, b) {
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
    static luminance(hex) {
        const { r, g, b } = TaggingControls.hexToRgb(hex);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
                        const backgroundColor = color || TaggingControls.DEFAULT_BACKGROUND;
                        e.dataset.tag = label;
                        e.style.setProperty('--bg', backgroundColor);
                        e.style.setProperty('--color', TaggingControls.luminance(backgroundColor) > 0.5 ? '#000' : '#FFF');
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
        profileNode.setAttribute('title', 'View Profile');
        profileNode.classList.add('profile');
        profileNode.classList.add('button');
        colorInputNode.setAttribute('type', 'color');
        tagInputNode.setAttribute('type', 'text');
        tagInputNode.setAttribute('placeholder', 'Tag');
        tagInputNode.setAttribute('maxlength', '16');
        saveButton.setAttribute('type', 'button');
        saveButton.setAttribute('title', 'Save');
        saveButton.classList.add('save');
        saveButton.classList.add('button');
        closeButton.setAttribute('type', 'button');
        closeButton.setAttribute('title', 'Close');
        closeButton.classList.add('close');
        closeButton.classList.add('button');
        const tagInputNodeContainer = document.createElement('div');
        tagInputNodeContainer.appendChild(tagInputNode);
        const colorInputNodeContainer = document.createElement('div');
        colorInputNodeContainer.appendChild(colorInputNode);
        controlNode.appendChild(profileNode);
        controlNode.appendChild(tagInputNodeContainer);
        controlNode.appendChild(colorInputNodeContainer);
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
        styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS}[aria-hidden=true] {
			display: none;
		}`;
        styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} input[type="text"] {
			background: #f2f2f2;
color: #000;
font-family: inherit;
font-size: 9pt;
appearance: none;
width: 170px;
outline: 0;
border-left: solid 1px #00000038;
border-right: solid 1px #00000038;
border-top: 0;
border-bottom: 0;
padding: 0 10px;
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
		}`;
        styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button.save {
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='195.55 251.68 360.62 248.65'%3E%3Cpath d='M523.8 257.23 325.89 455.14l-98.27-89.98a18.94 18.94 0 0 0-13.723-5.238 18.941 18.941 0 0 0-11.852 33.18l111.62 102.25a18.941 18.941 0 0 0 26.187-.567l210.74-210.74v-.004a18.95 18.95 0 0 0 4.907-18.309 18.95 18.95 0 0 0-13.402-13.402 18.962 18.962 0 0 0-18.31 4.906z' fill='%23000' /%3E%3C/svg%3E%0A");
			background-size: 16px auto;
		}`;
        styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button.close {
			background-image: url("data:image/svg+xml,%3Csvg viewBox='256.17 233.43 261.45 261.45' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m406.79 364.16 106.08-106.55c5.684-5.684 5.684-14.68 0-19.891-5.684-5.684-14.68-5.684-19.891 0l-106.08 106.56-106.55-106.56c-5.684-5.684-14.68-5.684-19.891 0-5.684 5.684-5.684 14.68 0 19.891l106.08 106.55-106.08 106.56c-5.684 5.684-5.684 14.68 0 19.891 2.84 2.84 6.629 4.262 9.945 4.262 3.317 0 7.106-1.422 9.946-4.262l106.55-106.55 106.55 106.55c2.84 2.84 6.628 4.262 9.945 4.262 3.316 0 7.105-1.422 9.945-4.262 5.684-5.684 5.684-14.68 0-19.891z' fill='%23000'/%3E%3C/svg%3E");
			background-size: 14px auto;
		}`;
        styleNode.textContent += `.${TaggingControls.CSS_CONTROL_CLASS} > .button:disabled {
			opacity: 0.2;
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
        const topRounded = (top + height).toFixed(0);
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
