"use strict"

const MainJS = document.createElement("script");
MainJS.src = `main.js?v=${Date.now()}`;
document.head.appendChild(MainJS);

const MainCSS = document.createElement("link");
MainCSS.href = `main.css?v=${Date.now()}`;
MainCSS.rel = "stylesheet";
MainCSS.type = "text/css";
document.head.appendChild(MainCSS);