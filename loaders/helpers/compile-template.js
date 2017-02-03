const HL              = require('node-html-light');
const toSource        = require('tosource');
const utils           = require('./utils');
const breakExpression = require('./break-expression');


const STR = {
    undefined  : 'undefined',
    checkFor   : '*for',
    tag        : 'tag',
    text       : 'text',
    _bindings  : '_bindings',
    _bindVars  : '_bindVars',
    _inputs    : '_inputs',
    _inputVars : '_inputVars'
};

const CHECK = {
    reNameTest            : /this.([\w\d]+)/gi,
    renderContentStart    : '{{',
    renderContentEnd      : '}}',
    attributeBindingStart : '(',
    attributeBindingEnd   : ')',
    attributeInputStart   : '[',
    attributeInputEnd     : ']',
    domEvents             : ['onclick', 'onchange']
};

const TYPE = {
    expression    : 3,
    expressionMap : 4
};


// helpers
function checkFor(obj) {
    if ( obj.attribs && obj.attribs[STR.checkFor] ) {
        obj._for    = obj.attribs[STR.checkFor].split(' in ');
        obj._for[1] = breakExpression(obj._for[1]);

        obj._bindFor = [];

        obj._for[1].workMap.forEach(pair => {
            if ( pair[0] === TYPE.expression ) {
                obj._bindFor.push(pair[1]);
            } else if ( pair[0] === TYPE.expressionMap ) {
                obj._bindFor.push(pair[1][0]);
            }
        });

        delete obj.attribs[STR.checkFor];
    }
}

function extractDecoratedAttribute(obj, storeKey, varsKey, decoratorStart, decoratorEnd) {
    Object.keys(obj.attribs).forEach(key => {
        if ( key[0] === decoratorStart && key[key.length - 1] === decoratorEnd ) {
            let clearKey = key.slice(decoratorStart.length, -decoratorEnd.length);

            obj[storeKey]           = obj[storeKey] || {};
            obj[storeKey][clearKey] = breakExpression(obj.attribs[key]);

            obj[varsKey]           = obj[varsKey] || {};
            obj[varsKey][clearKey] = [];

            //for (let match, re = new RegExp(CHECK.reNameTest); match = re.exec(obj.attribs[key]);) {
            //    if ( obj[varsKey][clearKey].indexOf(match[1]) === -1 ) {
            //        obj[varsKey][clearKey].push(match[1]);
            //    }
            //}

            obj[storeKey][clearKey].workMap.forEach(pair => {
                if ( pair[0] === TYPE.expression ) {
                    obj[varsKey][clearKey].push(pair[1]);
                } else if ( pair[0] === TYPE.expressionMap ) {
                    obj[varsKey][clearKey].push(pair[1][0]);
                }
            });

            delete obj.attribs[key];
        }
    });
}


function extractBindings(obj) {
    extractDecoratedAttribute(obj, STR._bindings, STR._bindVars, CHECK.attributeBindingStart, CHECK.attributeBindingEnd);
    let iterObj = obj[STR._bindings];
    for (let k in iterObj) {
        if ( iterObj.hasOwnProperty(k) && !!~CHECK.domEvents.indexOf(k) ) {
            obj._bindDom    = obj._bindDom || {};
            obj._bindDom[k] = iterObj[k];
            delete iterObj[k];
        }
    }
    //if ( obj._bindDom ) {
    //    console.log(obj);
    //}
}


function extractInputs(obj) {
    extractDecoratedAttribute(obj, STR._inputs, STR._inputVars, CHECK.attributeInputStart, CHECK.attributeInputEnd);
}

function checkRenderContent(obj) {
    if ( obj.data && obj.data.indexOf(CHECK.renderContentStart) >= 0 ) {
        let parseMap = [];
        let str      = obj.data;
        let vars     = [];

        for (let i = 0, mode = false; i < str.length;) {
            if ( mode ) {
                let ind = str.indexOf(CHECK.renderContentEnd, i);
                if ( ind === -1 ) { ind = str.length; }
                let ex = str.slice(i, ind);

                for (let match, re = new RegExp(CHECK.reNameTest); match = re.exec(ex);) {
                    if ( vars.indexOf(match[1]) === -1 ) {
                        vars.push(match[1]);
                    }
                }

                parseMap.push(ex.split(';').map(breakExpression));
                i = ind + CHECK.renderContentEnd.length;
            } else {
                let ind = str.indexOf(CHECK.renderContentStart, i);
                if ( ind === -1 ) { ind = str.length; }
                parseMap.push(str.slice(i, ind));
                i = ind + CHECK.renderContentStart.length;
            }
            mode = !mode;
        }

        obj._renderMap  = parseMap;
        obj._renderVars = vars;
    }
}

const replacementKeys = {
    class : 'className'
};
function replaceAttrKeys(key) {
    return replacementKeys[key] || key;
}

function convertAttribs(ref) {
    let result = [];

    Object.keys(ref.attribs).forEach(key => {
        result.push([replaceAttrKeys(key), ref.attribs[key]]);
    });
    ref.attribs = result;
}

// main processor
function nodesToString(obj, params) {
    let knownSelectors = params.selectors || [];

    utils.iterateObject(obj, ref => {
        if ( ref._element ) {
            let data = ref._element;
            delete ref._element;
            Object.assign(ref, data);
        }
        if ( typeof(ref.parent) !== STR.undefined ) { delete ref.parent; }
        if ( typeof(ref.next) !== STR.undefined ) { delete ref.next; }
        if ( typeof(ref.prev) !== STR.undefined ) { delete ref.prev; }

        if ( ref.type === STR.tag ) {
            ref.type = 2;
            checkFor(ref);
            if ( knownSelectors.indexOf(ref.name) >= 0 ) {
                ref._componentSelector = ref.name;
            }
            extractBindings(ref);
            extractInputs(ref);
            convertAttribs(ref);
        } else if ( ref.type === STR.text ) {
            ref.type = 1;
            checkRenderContent(ref);
        } else if ( ref.type ) {
            ref.type = 0;
        }
    });
    return toSource(obj);
}

// exporting
module.exports = function (html, params) {
    let parsed = nodesToString(HL.Node.fromString(html), params);

    //console.log('--TPL:\n\n', html, '\n');
    //console.log('--NODE:\n\n', parsed, '\n');

    //return utils.formatStr(html);
    return parsed;
};
