// ==UserScript==
// @name         Sudoku9x9 AutoClean Button
// @namespace    https://github.com/gerchikov
// @updateURL    https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/sudoku-game-assistant.user.js
// @downloadURL  https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/sudoku-game-assistant.user.js
// @supportURL   https://github.com/gerchikov/Tampermonkey-userscripts/issues
// @version      2026-07-27
// @description  Adds an AutoClean control that repeatedly fills candidate values
// @author       YDG
// @match        *://www.sudoku9x9.com/*
// @match        *://sudoku9x9.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sudoku9x9.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function getGameState(digitCountSelector = "p.nmleft") {
        const digitCountElements = document.querySelectorAll(digitCountSelector);
        if (!digitCountElements || digitCountElements.length !== 9) {
            alert(`AutoClean detected a structural change:\n`
                + `"${digitCountSelector}" not found for all nine digits.\n`
                + `Please fix sudoku-game-assistant.user.js`);
            throw new Error("AutoClean detected a structural change");
        }
        return Array.from(digitCountElements)
            .map(el => el.textContent || '')
            .join('|');
    }

    function runAutoClean(buttons, maxIterations = 50) {
        let previousState = '';

        for (let iterations = 0; iterations < maxIterations; iterations++) {
            buttons.forEach(b => b.click());

            const currentState = getGameState();
            // Stop if the game state did not change in this iteration
            if (currentState === previousState) {
                console.log(`AutoClean finished after ${iterations} iterations (no further changes).`);
                break;
            }
            previousState = currentState;
        }
    }

    function addAutoCleanButton(convBoxId = 'div#convbox', buttonIds = ['div#convp', 'div#cpencilpic', 'div#fillall']) {
        if (document.getElementById('custom-autoclean-btn')) return;

        // Target div#convbox directly
        const convBoxElem = document.querySelector(convBoxId);
        if (!convBoxElem) {
            console.warn(`AutoClean not added:\n`
                       + `"${convBoxId}" not found.`);
            return;
        }

        // Target the UI elements directly
        // Sequence: convtp -> clear_pencilmark -> fillallcells
        const buttons = buttonIds.map(id => document.querySelector(id));

        // The following check will break (give a false positive)
        // if the site ever changes to wire up its buttons with `addEventListener('click', ...)`
        // instead of `onclick = ...`. If it does, drop the "function-ness" part of the check,
        // as there is no reliable way to introspect addEventListener-bound handlers.
        const missingIndex = buttons.findIndex(b => !b || typeof b.onclick !== 'function');
        if (missingIndex !== -1) {
            console.warn(`AutoClean not added:\n`
                       + `"${buttonIds[missingIndex]}" not found or has no click handler.`);
            return;
        }

        // Create the custom control as a div element
        const btn = document.createElement('div');
        btn.id = 'custom-autoclean-btn';
        btn.innerText = 'AutoClean';

        // Style matching the neighboring tools
        btn.style.cssText = `
            display: inline-block;
            vertical-align: middle;
            margin-left: 6px;
            height: 32px;
            line-height: 30px;
            padding: 0 8px;
            font-size: 12px;
            font-family: inherit;
            font-weight: bold;
            color: #222222;
            background-color: #f5f5f5;
            border: 1px solid #999999;
            border-radius: 4px;
            cursor: pointer;
            user-select: none;
            box-sizing: border-box;
            text-align: center;
            white-space: nowrap;
        `;

        // Interactive hover feedback
        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#e0e0e0');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#f5f5f5');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            runAutoClean(buttons);
        });

        // Insert directly after div#convbox
        convBoxElem.parentNode.insertBefore(btn, convBoxElem.nextSibling);
    }

    addAutoCleanButton();
})();
