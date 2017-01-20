const fs = require('fs');
const path = require('path');
const re = /@(Component)\(({[\s\d\w:'",.\/-_=+~]+})?\)\s*(?:export)?\s+class\s+([\w\d_]+)\s*\{\s*(?:constructor\(\)\s+\{([{}\s\d\w:'",.\/-_=+~]*)})?/gi;

function formatStr(str) {
 return ["'", str.replace("'", "\\'").replace('\n', ' '), "'"].join('');
}

function retrieveJson(str) {
    try {
        return eval('x = '+str);
    } catch(err) {
        return {};
    }
}

function readFileContent(reqPath, tplPath) {
    let resp = fs.readFileSync(path.resolve(reqPath.split('!')[1].split('/').slice(0, -1).join('/'), tplPath), 'utf8');
    console.log(resp);
    return resp;
}

module.exports = function (source, map) {
    // source - js code
    //console.log(this.request);

    let modifiedSource = source.replace(re, (match, type, params, name, constructorBody) => {
        params = retrieveJson(params);

        return `export class ${name} {\
            constructor() {\
                this.__name=${formatStr(name)};\
                this.__selector=${formatStr(params.selector)};\
                this.__template=${formatStr(readFileContent(this.request, params.template))};\
                ${constructorBody || ''}\
            }`;
    });

    //console.log(modifiedSource);

    this.callback(null, modifiedSource, map);
};
