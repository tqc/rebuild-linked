var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var npmPath = process.platform == "win32" ? "npm.cmd" : "npm";

function getModules(basePath) {
    var result = [];
    var names = [];
    var nmp = path.resolve(basePath, "node_modules");
    if (!fs.existsSync(nmp)) return result;
    var allModules = fs.readdirSync(nmp);
    for (var i = 0; i < allModules.length; i++) {
        var mn = allModules[i];
        var p = path.resolve(nmp, allModules[i]);
        if (mn.indexOf("@") == 0 && mn.indexOf("/") < 0) {
            var scopedModules = fs.readdirSync(p);
            for (var j = 0; j < scopedModules.length; j++) {
                allModules.push(mn + "/" + scopedModules[j]);
            }
            continue;
        }
        var stat = fs.lstatSync(p);
        if (stat.isSymbolicLink()) {
            var pkgPath = path.resolve(p, "package.json");
            if (!fs.existsSync(pkgPath)) continue;
            var pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            if (!pkg.scripts) continue;
            //if (!pkg.scripts.compile) continue;
            names.push(mn);
            result.push({
                name: mn,
                path: fs.realpathSync(p),
                buildNeeded: !!pkg.scripts.compile
            });
            var submodules = getModules(p).filter(m => names.indexOf(m.name) < 0);
            names.push.apply(names, submodules.map(m => m.name));
            result.push.apply(result, submodules);
        }
    }

    return result;
}

function ensureModulesBuilt(basePath) {
    var modules = getModules(basePath);
    for (var i = 0; i < modules.length; i++) {
        var m = modules[i];
        if (m.buildNeeded) {
            console.log("running npm run compile in " + m.path);
            var r = cp.spawnSync(npmPath, ["run", "compile"], {
                cwd: m.path,
                stdio: [0, 1, 2]
            });
            // non-zero exit code is ignored for now
            console.log(r.status);
        }
    }
}


export {getModules, ensureModulesBuilt};