// ==UserScript==
// @name         pc_json
// @namespace    https://github.com/gerchikov
// @version      2025-10-27
// @description  Empower / Personal Capital: holdings --> CSV
// @author       YDG
// @match        https://home.personalcapital.com/page/login/app
// @match        https://ira.empower-retirement.com/dashboard/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=personalcapital.com
// @updateURL    https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/pc_json.user.js
// @downloadURL  https://github.com/gerchikov/Tampermonkey-userscripts/raw/main/pc_json.user.js
// @supportURL   https://github.com/gerchikov/Tampermonkey-userscripts/issues
// @grant        GM_setClipboard
// @run-at       context-menu
// ==/UserScript==

(function() {
    'use strict';

    // PROBLEM: this fires too soon, before the app is fully initialized and before the native call to getHoldings.
    // SOLUTION: disable automatic invokation, execute manually from TM context menu for now.
    // BETTER(?) SOLUTION: add a (fixed?) delay; or figure out when holdings are loaded on the page.

    // window.onhashchange = pc_json;
    pc_json();

    async function pc_json() {
        // if (location.hash !== "#/portfolio/holdings") return;
        console.log("pc_json log");

        /* global csrf */
        if (!csrf) {
            alert("ERROR: No CSRF token");
            return;
        }

        const host =
              location.host === "home.personalcapital.com" ? "https://home.personalcapital.com/api/invest/getHoldings" :
              location.host === "ira.empower-retirement.com" ? "https://pc-api.empower-retirement.com/api/invest/getHoldings" : "";
        if (!host) {
            alert("ERROR: Unknown host");
            return;
        }

        const response = await fetch(host, {
            "headers": {
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            "body":
               "csrf=" + csrf +
               "&apiClient=WEB",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
        console.debug(response);
        const json = await response.json();
        console.debug(json);

        if (!json.spData || !json.spData.holdings) {
            alert("ERROR: No spData.holdings in json:\n" + json);
            return;
        }
        const holdings = json.spData.holdings;

        // convert json to tab-delimited, pad to max dimensions, write to clipboard
        const MAX_DIMENSIONS = 60;

        // 1. Get all unique fieldnames
        let fieldnames = Array.from(new Set(holdings.flatMap((h) => Object.keys(h))));
        const fieldCount = fieldnames.length;

        // 2. Pad columns if necessary
        if (fieldCount >= MAX_DIMENSIONS) {
            console.warn(
                `WARNING: number of columns (${fieldCount}) exceeds max dimensions (${MAX_DIMENSIONS}). ` +
                'No padding columns will be added.'
            );
        } else {
            const padding = Array(MAX_DIMENSIONS - fieldCount).fill('');
            fieldnames = fieldnames.concat(padding);
        }

        // 3. Create the tab-delimited CSV string
        const csvRows = [];
        csvRows.push(fieldnames.join('\t')); // Write header

        for (const holding of holdings) {
            const row = fieldnames.map(key => holding.hasOwnProperty(key) ? holding[key] : '');
            csvRows.push(row.join('\t'));
        }

        // 4. Pad rows if necessary
        const rowCount = holdings.length;
        if (rowCount >= MAX_DIMENSIONS) {
            console.warn(
                `WARNING: number of rows (${rowCount}) exceeds max dimensions (${MAX_DIMENSIONS}). ` +
                'No padding rows will be added.'
            );
        } else {
            const emptyRow = fieldnames.map(() => '').join('\t');
            const rowsToAdd = MAX_DIMENSIONS - rowCount;
            for (let i = 0; i < rowsToAdd; i++) {
                csvRows.push(emptyRow);
            }
        }

        // 5. Copy to clipboard
        // await navigator.clipboard.writeText(csvRows.join('\n'));
        GM_setClipboard(csvRows.join('\n'), "text");

        // 6. message to remind to paste
        // alert or notification?
        // GM_notification({ text: "pc_json notification" });
        alert(
            `SUCCESS: ${rowCount} rows of ${fieldCount} tab-delimited columns (before padding) are written to clipboard.\n` +
            'Please paste directly into Excel or Google Sheets.'
        );
    }
})();
