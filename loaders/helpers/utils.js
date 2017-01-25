const fs   = require('fs');
const path = require('path');

const STR = {
    undefined : 'undefined',
    object    : 'object',
    string    : 'string',
    xeq       : 'x = ',
    q         : "'",
    mark      : '!',
    slash     : '/',
    space     : ' ',
    utf       : 'utf8',
    empty     : ''
};

function retrieveJson(str) {
    try {
        return eval(STR.xeq + str);
    } catch (err) {
        return {};
    }
}

function formatStr(str) {
    return [STR.q, str.trim().replace(/'/g, "\\'").replace(/(?:\r?\n|\r)\s*/g, STR.space), STR.q].join(STR.empty);
}

function readFileContent(reqPath, tplPath) {
    let resp = fs.readFileSync(path.resolve(reqPath.split(STR.mark)[1].split(STR.slash).slice(0, -1).join(STR.slash), tplPath), STR.utf);
    //console.log(resp);
    return resp;
}

function iterateObject(target, callback) {
    if ( target ) {
        callback(target);

        if ( typeof(target) === STR.object ) {
            if ( target.constructor === Array ) {
                target.forEach(v => iterateObject(v, callback));
            } else {
                Object.keys(target).forEach(key => iterateObject(target[key], callback));
            }
        }
    }
}

module.exports = {retrieveJson, formatStr, readFileContent, iterateObject};