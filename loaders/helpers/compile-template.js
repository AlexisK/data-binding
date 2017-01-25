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
    renderContentStart : '{{',
    renderContentEnd   : '}}'
};


// helpers
function checkFor(obj) {
    if ( obj.attribs && obj.attribs[STR.checkFor] ) {
        obj._for = obj.attribs[STR.checkFor].split(' in ');
        delete obj.attribs[STR.checkFor];
    }
}

function checkRenderContent(obj) {
    if ( obj.data && obj.data.indexOf(CHECK.renderContentStart) >= 0 ) {
        let parseMap = [];
        let str = obj.data;

        for (let i = 0, mode = false; i < str.length;) {
            if ( mode ) {
                let ind = str.indexOf(CHECK.renderContentEnd, i);
                if ( ind === -1 ) { ind = str.length; }
                let ex = str.slice(i, ind);
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

        obj._renderMap = parseMap;
    }
}

// main processor
function nodesToString(obj) {
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
        }
        if ( ref.type === STR.text ) {
            checkRenderContent(ref);
        }
    });
    return toSource(obj);
}

// exporting
module.exports = function (html) {
    let parsed = nodesToString(HL.Node.fromString(html));

    console.log('--TPL:\n\n', html, '\n');
    console.log('--NODE:\n\n', parsed, '\n');

    //return utils.formatStr(html);
    return parsed;
};
