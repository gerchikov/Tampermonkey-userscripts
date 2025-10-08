// ==UserScript==
// @name         Baker's Game Assistant
// @version      2025-10-08
// @description  Invoke https://fc-solve.shlomifish.org/js-fc-solve/text/ for the current board
// @match        *://www.free-freecell-solitaire.com/bakers_game.html
// @author       YDG
// @namespace    https://github.com/gerchikov
// @grant        none
// @updateURL    https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/bakers-game-assistant.user.js
// @downloadURL  https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/bakers-game-assistant.user.js
// @supportURL   https://github.com/gerchikov/Tampermonkey-userscripts/issues
// ==/UserScript==

(function() {
    'use strict';

    const key = "treecardgames.solitaire.freecell.bakersgame.lastGame";
    const val = localStorage.getItem(key);
    if (!val) {
        console.error("Error reading " + key + " from localStorage");
        return null;
    }
    console.debug(val);

    const game = JSON.parse(val);
    const gameNumber = game.game.gameNumber;
    const containers = game.game.containers;
    console.debug(containers);

    /* 16 containers in game are: 4 freecells, 4 foundations and 8 tableau
       Format text input for solver as follows:
Freecells: - - - 6C
Foundations: S-3 D-A
AH TH 4S KS 8D QH TC
6H 2H 3D JD KD 7D 5S
    */

    const freecells = containers.slice(0, 4).map(cardList).map(c => c || '-').join(' ');
    const foundations = containers.slice(4, 8).map(cardList).filter(Boolean).map(c => c.at(-1) + '-' + c.at(-2)).join(' ');
    const tableau = containers.slice(8, 16).map(cardList).join("\n");

    const textToCopy = ["Freecells: " + freecells, "Foundations: " + foundations, tableau].join('\n');

    navigator.clipboard.writeText(textToCopy).catch(
        err => console.error("Failed to copy: " + err)
    );

    // also, attempt to open solver in new tab:
    const href = "https://fc-solve.shlomifish.org/js-fc-solve/text/?deal_number="
    + gameNumber + "&game_type=bakers_game&num_columns=default"
    + "&num_freecells=default&one_based=1&preset=lg&stdin="
    + encodeURIComponent(textToCopy) + "&string_params=--empty-stacks-filled-by%20kings";
    // this will likely be blocked by the browser -- look for "pop-up blocked ..." in address line:
    window.open(href, "_blank", "noopener,noreferrer");

    return;

    // Convert 0-based card index (as in game) to short 2-character card code (as in solver):
    function cardName(index) {
        const suits = "SHCD"; // Spades, Hearts, Clubs, Diamonds
        const ranks = "A23456789TJQK";
        if (index < 0 || index > 51) return "??";
        const suit = suits.at(Math.floor(index / 13));
        const rank = ranks.at(index % 13);
        return rank + suit;
    }

    // Convert an array of card indices into a space-separated string of card codes:
    function cardList(indices) {
        return indices.map(cardName).join(" ");
    }

})();