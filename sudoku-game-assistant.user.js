// ==UserScript==
// @name         Sudoku9x9 AutoClean Button
// @namespace    https://github.com/gerchikov
// @updateURL    https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/sudoku-game-assistant.user.js
// @downloadURL  https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/sudoku-game-assistant.user.js
// @supportURL   https://github.com/gerchikov/Tampermonkey-userscripts/issues
// @version      2026-07-24
// @description  Adds an AutoClean control that repeatedly fills candidate values
// @author       YDG
// @match        *://www.sudoku9x9.com/*
// @match        *://sudoku9x9.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sudoku9x9.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function getGameState() {
        const digitCountSelector = "p.nmleft";
        const digitCountElements = document.querySelectorAll(digitCountSelector);
        if (!digitCountElements || digitCountElements.length !== 9) {
            alert(`AutoClean detected a structural change:\n`
                + `"${digitCountSelector}" not found for all nine digits.\n`
                + `Please fix sudoku-game-assistant.user.js`);
        }
        return Array.from(digitCountElements)
            .map(el => el.textContent || '')
            .join('|');
    }

    function runAutoClean(buttons) {
        let maxIterations = 50; // Safety limit against infinite loops
        let iterations = 0;
        let previousState = '';

        while (iterations < maxIterations) {
            buttons.forEach(b => b.click());

            const currentState = getGameState();

            // Stop if the game state did not change in this iteration
            if (currentState === previousState) {
                console.log(`AutoClean finished after ${iterations} iterations (no further changes).`);
                break;
            }

            previousState = currentState;
            iterations++;
        }
    }

    function addAutoCleanButton() {
        if (document.getElementById('custom-autoclean-btn')) return;

        // Target div#convbox directly
        const convBoxId = 'div#convbox';
        const convBoxElem = document.querySelector(convBoxId);
        if (!convBoxElem) {
            alert(`AutoClean detected a structural change:\n`
                + `"${convBoxId}" not found.\n`
                + `Please fix sudoku-game-assistant.user.js`);
            return;
        }

        // Target the UI elements directly
        // Sequence: convtp -> clear_pencilmark -> fillallcells
        const buttonIds = ['div#convp', 'div#cpencilpic', 'div#fillall'];
        const buttons = buttonIds.map(id => document.querySelector(id));
        buttons.forEach((b, i) => {
            if (!b || typeof b.onclick !== 'function') {
                alert(`AutoClean detected a structural change:\n`
                      + `"${buttonIds[i]}" not found or has no click handler.\n`
                      + `Please fix sudoku-game-assistant.user.js`);
                return;
            }
        });

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
