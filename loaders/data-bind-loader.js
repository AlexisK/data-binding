const fs   = require('fs');
const path = require('path');

const utils = require("./helpers/utils");
const compileTemplate = require('./helpers/compile-template');

const re            = /@(Component)\(({[\s\d\w:'",.\/\-_=+~]+})?\)\s*(?:export)?\s+class\s+([\w\d_]+)\s*\{([\s\d\w:'";,.\/\-_=+~(){}[\]]*)}\s*$/igm;
const reConstructor = /constructor\(\)\s*\{/;


function injectToConstructor(classBody, name, params, loader) {
    let match         = new RegExp(reConstructor).exec(classBody);
    let pos           = match.index + match[0].length;
    let beforeContent = match.input.slice(0, pos);
    let afterContent  = match.input.slice(pos);

    let i = 0;
    for (let check = 1; check && i < afterContent.length; i++) {
        if ( /\{/.test(afterContent[i]) ) {check += 1;}
        if ( /}/.test(afterContent[i]) ) {check -= 1;}
    }
    i -= 1;

    let constructorContent = afterContent.slice(0, i);
    afterContent           = afterContent.slice(i);

    return [beforeContent, `\
\nthis.__component = new Component();\
\nthis.__component.__name=${utils.formatStr(name)};\
\nthis.__component.__selector=${utils.formatStr(params.selector)};\
\nthis.__component.__updateMethod=${utils.formatStr(params.update || 'property')};\
\nthis.__component.__template=${compileTemplate(utils.readFileContent(loader.request, params.template))};\n\
`, constructorContent, '\nthis.__component.init(this);', afterContent].join('');
}

module.exports = function (source, map) {
    // source - js code
    //console.log(this.request);

    let modifiedSource = source.replace(re, (match, type, params, name, classBody) => {
        params = utils.retrieveJson(params);

        return [`export class ${name} {`, injectToConstructor(classBody, name, params, this), '}'].join('');
    });

    //console.log(modifiedSource);

    this.callback(null, modifiedSource, map);
};
