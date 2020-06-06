"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const testDefs = require("./testdefs.json");
let testLoader = new index_1.DefinitionLoader();
testLoader.add(testDefs);
let track = testLoader.build().track;
track.addPlayer(new index_1.TonejsPlayer());
track.
;
