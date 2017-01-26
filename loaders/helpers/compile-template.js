const HL       = require('node-html-light');
const toSource = require('tosource');
const utils    = require('./utils');


const STR = {
    undefined : 'undefined',
    checkFor  : '*for',
    tag       : 'tag',
    text      : 'text'
};

const CHECK = {
    reNameTest            : /this.([\w\d]+)/gi,
    renderContentStart    : '{{',
    renderContentEnd      : '}}',
    attributeBindingStart : '(',
    attributeBindingEnd   : ')',
    attributeInputStart   : '[',
    attributeInputEnd     : ']'
};


// helpers
function checkFor(obj) {
    if ( obj.attribs && obj.attribs[STR.checkFor] ) {
        obj._for = obj.attribs[STR.checkFor].split(' in ');
        delete obj.attribs[STR.checkFor];
    }
}

function extractBindings(obj) {
    Object.keys(obj.attribs).forEach(key => {
        if ( key[0] === CHECK.attributeBindingStart && key[key.length - 1] === CHECK.attributeBindingEnd ) {
            obj._bindings                   = obj._bindings || {};
            obj._bindings[key.slice(1, -1)] = obj.attribs[key];
            delete obj.attribs[key];
        }
    });
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

                for (let match; match = CHECK.reNameTest.exec(ex);) {
                    if ( vars.indexOf(match[1]) === -1 ) {
                        vars.push(match[1]);
                    }
                }

                parseMap.push(ex.split(';'));
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
            checkFor(ref);
            if ( knownSelectors.indexOf(ref.name) >= 0 ) {
                ref._componentSelector = ref.name;
            }
            extractBindings(ref);
            convertAttribs(ref);
        }
        if ( ref.type === STR.text ) {
            checkRenderContent(ref);
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
