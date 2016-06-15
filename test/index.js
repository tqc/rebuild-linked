import * as rbl from "../src";

console.log(rbl.getModules(process.cwd()));
rbl.ensureModulesBuilt(process.cwd());