const fs   = require('fs');
const path = require('path');

const utils           = require("./helpers/utils");
const compileTemplate = require('./helpers/compile-template');

const reTemplateAll = /@(Component)\(({[\s\d\w:'",.\/\-_=+~]+})?\)\s*(?:export)?\s+class\s+([\w\d_]+)\s*\{([\s\d\w:'";,.\/\-_=+~(){}[\]]*)}\s*$/igm;
const reTemplateKey = /@Component\({[\s\w\d:'",.\-/\\]+selector\s*:\s*'([\s\w\d\-[\]./\\]+)'/gi;
const reConstructor = /constructor\(\)\s*\{/;


const knownSelectors = [];
function retrieveSelectors(html) {
    for (let match, re = new RegExp(reTemplateKey); match = re.exec(html);) {
        if ( knownSelectors.indexOf(match[1]) === -1 ) {
            knownSelectors.push(match[1]);
        }
    }
}

const updateMethodInds = {
    'property' : 0,
    'hook'     : 1,
    'constant' : 2
};

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

    let templatePath = utils.getTemplatePath(loader.request, params.template);
    loader.addDependency(templatePath);

    return [beforeContent, `\
\nthis.__component = new Component();\
\nthis.__component.__name=${utils.formatStr(name)};\
\nthis.__component.__selector=${utils.formatStr(params.selector)};\
\nthis.__component.__updateMethod=${updateMethodInds[params.update || 'property']};\
\nthis.__component.__template=${compileTemplate(utils.readFileContent(templatePath), {
        selectors : knownSelectors
    })};\n\
`, constructorContent, '\nthis.__component.init(this);', afterContent].join('');
}

function prepareModified(source) {
    return new Promise(resolve => {
        retrieveSelectors(source);

        setTimeout(() => {
            let result = source.replace(reTemplateAll, (match, type, params, name, classBody) => {
                params = utils.retrieveJson(params);

                return [`export class ${name} {`, injectToConstructor(classBody, name, params, this), '}'].join('');
            });
            resolve(result);
        }, 100);
    });
}

module.exports = function (source, map) {
    // source - js code
    //console.log(this.request);
    const callback = this.async();

    prepareModified.call(this, source).then(modifiedSource => {
        //console.log(this.request);
        //console.log(modifiedSource);

        callback(null, modifiedSource, map);
    });

};
