#!/usr/bin/env node
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

const fs = __nccwpck_require__(147);

// 读取JSON文件
fs.readFile('hugo_site/data/data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error wile reading file: ', err);
      return;
    }
  
    try {
      const jsonData = JSON.parse(data);
      const categories = {};
  
      // 根据category字段生成文本内容
      jsonData.forEach(item => {
        if (item.category) {
          if (!categories[item.category]) {
            categories[item.category] = [];
          }
          categories[item.category].push(item);
        }
      });
      
      const now = new Date();
      const formattedTime = formatDateTime(now);

      // 生成文本文件
      Object.keys(categories).forEach(category => {
        const categoryData = categories[category];
        // const fileContent = categoryData.map(item => JSON.stringify(item)).join('\n');
        const fileContent = `---\ntitle: \"${category}\"\ndate: ${formattedTime}\ndraft: false\n---\n\n{{< json-filter category=\"${category}\" >}}`;
        
        const fileName = `hugo_site/content/posts/${category}.md`;
  
        fs.writeFile(fileName, fileContent, err => {
          if (err) {
            console.error(`Fail while writing ${fileName}`, err);
          } else {
            console.log(`Success generate ${fileName}`);
          }
        });
      });
    } catch (err) {
      console.error('Fail to phase json', err);
    }
  });

  function formatDateTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月份从0开始计数，需要加1
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const timezoneOffset = date.getTimezoneOffset();
  
    const timezoneOffsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneOffsetMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset >= 0 ? '-' : '+';
  
    const timezone = `${timezoneSign}${padZero(timezoneOffsetHours)}:${padZero(timezoneOffsetMinutes)}`;
  
    const formattedTime = `${year}-${padZero(month)}-${padZero(day)}T${padZero(hour)}:${padZero(minute)}:${padZero(second)}${timezone}`;
  
    return formattedTime;
  }
  
  // 在个位数前填充零
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }
})();

module.exports = __webpack_exports__;
/******/ })()
;