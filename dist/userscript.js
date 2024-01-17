// ==UserScript==
// @name         Hacker News User Tags
// @version      0.0.4
// @description  Allows the user to associate a custom coloured label/tag on usernames throughout Hacker News.
// @author       Lachlan McDonald <https://github.com/lachlanmcdonald>
// @match        https://news.ycombinator.com/*
// @icon         https://news.ycombinator.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/lachlanmcdonald/hackernews-user-tags/main/dist/userscript.js
// @downloadURL  https://raw.githubusercontent.com/lachlanmcdonald/hackernews-user-tags/main/dist/userscript.js
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-idle
// @license      MIT
// @noframes
// ==/UserScript==
(function(){"use strict";var STYLES=".tm-tag::after {content: attr(data-tag);display: inline-block;padding: 1px 4px;border-radius: 4px;background: var(--bg);color: var(--color);margin: 0 0.25rem;vertical-align: baseline;font-size: 7pt;}.tm-tag__controls {z-index: 1000;top: var(--top);left: var(--left);position: absolute;background: #FFF;border-radius: 6px;box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.2196078431);font-size: 9pt;overflow: hidden;border: solid 1px rgba(0, 0, 0, 0.2196078431);display: flex;flex-flow: row nowrap;align-items: stretch;align-content: center;gap: 4px;}.tm-tag__controls > a {color: #000;text-decoration: none;display: flex;padding: 2px 8px;align-items: center;}.tm-tag__controls > a:hover {text-decoration: underline;}.tm-tag__controls input[type=text] {background: var(--bg);color: var(--color);font-family: inherit;font-size: 9pt;appearance: none;width: 120px;outline: 0;border: 0;border-radius: 6px;padding: 5px 8px;}.tm-tag__controls input[type=color] {width: 38px;outline: 0;border: 0;background: none;}.tm-tag__controls > div {display: flex;align-items: center;}.tm-tag__controls > .button {cursor: pointer;width: 38px;height: 38px;border: 0;padding: 0;appearance: none;background: transparent;opacity: 0.6;display: flex;flex-direction: row;flex-wrap: nowrap;justify-content: center;align-items: center;}.tm-tag__controls > .button > svg {height: auto;display: block;}.tm-tag__controls > .button:hover {opacity: 1;}.tm-tag__controls > .button.profile > svg {width: 14px;}.tm-tag__controls > .button.save > svg {width: 16px;}.tm-tag__controls > .button.close > svg {width: 14px;}";const BUTTON_PROFILE='<svg xmlns="http://www.w3.org/2000/svg" viewBox="176.8 162.88 398.4 426.23"><path d="M479.4 266.29c0 57.105-46.293 103.4-103.4 103.4-57.102 0-103.39-46.293-103.39-103.4 0-57.102 46.293-103.39 103.39-103.39 57.105 0 103.4 46.293 103.4 103.39"/><path d="M176.83 537.26c0 69.137 398.34 69.137 398.34 0 0-92.551-89.172-167.58-199.17-167.58s-199.17 75.027-199.17 167.58z" fill="#000" /></svg>';const BUTTON_SAVE='<svg xmlns="http://www.w3.org/2000/svg" viewBox="195.55 251.68 360.62 248.65"><path d="M523.8 257.23 325.89 455.14l-98.27-89.98a18.94 18.94 0 0 0-13.723-5.238 18.941 18.941 0 0 0-11.852 33.18l111.62 102.25a18.941 18.941 0 0 0 26.187-.567l210.74-210.74v-.004a18.95 18.95 0 0 0 4.907-18.309 18.95 18.95 0 0 0-13.402-13.402 18.962 18.962 0 0 0-18.31 4.906z" fill="#000" /></svg>';const BUTTON_CLOSE='<svg viewBox="256.17 233.43 261.45 261.45" xmlns="http://www.w3.org/2000/svg"><path d="m406.79 364.16 106.08-106.55c5.684-5.684 5.684-14.68 0-19.891-5.684-5.684-14.68-5.684-19.891 0l-106.08 106.56-106.55-106.56c-5.684-5.684-14.68-5.684-19.891 0-5.684 5.684-5.684 14.68 0 19.891l106.08 106.55-106.08 106.56c-5.684 5.684-5.684 14.68 0 19.891 2.84 2.84 6.629 4.262 9.945 4.262 3.317 0 7.106-1.422 9.946-4.262l106.55-106.55 106.55 106.55c2.84 2.84 6.628 4.262 9.945 4.262 3.316 0 7.105-1.422 9.945-4.262 5.684-5.684 5.684-14.68 0-19.891z" fill="#000"/></svg>';class TaggingControls{constructor(){this.tags=new Map;this.elements={containers:{},links:{},inputs:{},button:{}};this.currentUsername=null;this.isOpen=false;this.ownUsername=null;this.setup()}static rgbToHex(r,g,b){const k=[r,g,b].map((x=>x.toString(16).padStart(2,"0")));return`#${k.join()}`}static hexToRgb(hex){const shorthandRegex=/^#?([a-f\d])([a-f\d])([a-f\d])$/iu;hex=hex.replace(shorthandRegex,((_m,r,g,b)=>[r,r,g,g,b,b].join("")));const result=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/iu.exec(hex);return result?{r:parseInt(result[1],16),g:parseInt(result[2],16),b:parseInt(result[3],16)}:{r:0,g:0,b:0}}static luminance(hex){const{r:r,g:g,b:b}=TaggingControls.hexToRgb(hex);return.2126*(r/255)+.7152*(g/255)+.0722*(b/255)}setup(){const ownProfileLink=document.getElementById("me");this.ownUsername=ownProfileLink?(ownProfileLink.textContent||"").trim():null;this.load().then((()=>{this.addStyles();this.createControls();this.addEventListeners();this.applyTags()}))}applyTags(){const links=Array.from(document.querySelectorAll('a[href^="user?"]'));const usernames=links.reduce(((temp,link)=>{const u=new URL(link.href);const username=u.searchParams.get("id");if(username!==null){if(Object.prototype.hasOwnProperty.call(temp,username)===false){temp[username]=[]}temp[username].push(link)}return temp}),{});Object.entries(usernames).forEach((([username,links])=>{if(this.tags.has(username)){const{label:label,color:color}=this.tags.get(username);const backgroundColor=color||TaggingControls.DEFAULT_BACKGROUND;const textColor=TaggingControls.luminance(backgroundColor)>.5?"#000":"#FFF";if(typeof label==="string"&&label.length){links.forEach((e=>{e.dataset.tag=label;e.style.setProperty("--bg",backgroundColor);e.style.setProperty("--color",textColor);e.classList.add(TaggingControls.CSS_CLASS)}))}else{links.forEach((e=>{e.classList.remove(TaggingControls.CSS_CLASS)}))}}}))}createControls(){const controlNode=Object.assign(document.createElement("div"),{className:TaggingControls.CSS_CONTROL_CLASS});const profileLink=Object.assign(document.createElement("a"),{title:"View Profile",className:"button profile"});const saveButton=Object.assign(document.createElement("button"),{type:"button",title:"Save",className:"button save"});const closeButton=Object.assign(document.createElement("button"),{type:"button",title:"Close",className:"button close"});const labelInput=Object.assign(document.createElement("input"),{type:"text",placeholder:"Tag",maxlength:"16"});const colorInput=Object.assign(document.createElement("input"),{type:"color"});profileLink.innerHTML=BUTTON_PROFILE;saveButton.innerHTML=BUTTON_SAVE;closeButton.innerHTML=BUTTON_CLOSE;const tagInputNodeContainer=document.createElement("div");const colorInputNodeContainer=document.createElement("div");tagInputNodeContainer.appendChild(labelInput);colorInputNodeContainer.appendChild(colorInput);controlNode.appendChild(profileLink);controlNode.appendChild(tagInputNodeContainer);controlNode.appendChild(colorInputNodeContainer);controlNode.appendChild(saveButton);controlNode.appendChild(closeButton);this.elements.containers.controls=controlNode;this.elements.links.profile=profileLink;this.elements.inputs.label=labelInput;this.elements.inputs.color=colorInput;this.elements.button.save=saveButton;this.elements.button.close=closeButton}addStyles(){const head=document.querySelector("head");if(head){const styleNode=document.createElement("style");styleNode.innerHTML=STYLES;head.appendChild(styleNode)}}saveTag(username,label,color){if(username){this.tags.set(username,{label:label===""?null:label,color:color===""?null:color});this.save().then((()=>{this.applyTags()}))}}hideControls(){if(this.elements.containers.controls.parentElement){this.elements.containers.controls=this.elements.containers.controls.parentElement.removeChild(this.elements.containers.controls)}this.isOpen=false}showControls(target){const{left:left,top:top,height:height}=target.getBoundingClientRect();const topRounded=(top+height+window.scrollY).toFixed(0);const leftRounded=(left+window.scrollX).toFixed(0);this.elements.containers.controls.style.setProperty("--top",`${topRounded}px`);this.elements.containers.controls.style.setProperty("--left",`${leftRounded}px`);document.body.appendChild(this.elements.containers.controls);this.isOpen=true}updateControlInput(backgroundColor){const textColor=TaggingControls.luminance(backgroundColor)>.5?"#000":"#FFF";this.elements.inputs.label.style.setProperty("--bg",backgroundColor);this.elements.inputs.label.style.setProperty("--color",textColor)}addEventListeners(){this.elements.button.close.addEventListener("click",(e=>{this.hideControls();e.preventDefault()}));this.elements.button.save.addEventListener("click",(e=>{e.preventDefault();this.hideControls();if(this.currentUsername){const label=this.elements.inputs.label.value.trim();const color=this.elements.inputs.color.value;this.saveTag(this.currentUsername,label,color)}}));this.elements.inputs.color.addEventListener("input",(e=>{const target=e.target;this.updateControlInput(target.value)}));document.body.addEventListener("click",(e=>{if(e.target){const target=e.target;const link=target.closest("a");if(link&&link!==this.elements.links.profile){const u=new URL(link.href);if(u.pathname==="/user"&&u.searchParams.has("id")){const username=u.searchParams.get("id");if(typeof username==="string"&&username!==this.ownUsername){const existingLabel=this.tags.has(username)?this.tags.get(username).label||"":"";const existingColor=this.tags.has(username)?this.tags.get(username).color||TaggingControls.DEFAULT_BACKGROUND:TaggingControls.DEFAULT_BACKGROUND;e.preventDefault();this.elements.links.profile.href=link.href;this.elements.inputs.color.value=existingColor;this.updateControlInput(existingColor);this.currentUsername=username;this.elements.inputs.label.value=existingLabel;this.showControls(link)}}}else if(this.isOpen){let parentNode=e.target;let withinControl=false;while(parentNode){if(parentNode===this.elements.containers.controls){withinControl=true}parentNode=parentNode.parentNode}if(withinControl===false){this.hideControls()}}}}))}}TaggingControls.DEFAULT_BACKGROUND="#d0d0c9";TaggingControls.GM_KEY="tm-tags";TaggingControls.CSS_CLASS="tm-tag";TaggingControls.CSS_CONTROL_CLASS="tm-tag__controls";class TamperMonkeyTaggingControls extends TaggingControls{async load(){const data=await GM.getValue(TaggingControls.GM_KEY,"{}");this.tags=new Map(Object.entries(JSON.parse(data)))}async save(){const existingData=await GM.getValue(TaggingControls.GM_KEY,"{}");const data={...JSON.parse(existingData),...Object.fromEntries(this.tags.entries())};await GM.setValue(TaggingControls.GM_KEY,JSON.stringify(data));this.tags=new Map(Object.entries(data))}}new TamperMonkeyTaggingControls})();
