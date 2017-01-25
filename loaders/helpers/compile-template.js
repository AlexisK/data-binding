const HL       = require('node-html-light');
const toSource = require('tosource');
const utils    = require('./utils');


const STR = {
    undefined : 'undefined'
};

function nodesToString(obj) {
    utils.iterateObject(obj, ref => {
        if ( typeof(ref.parent) !== STR.undefined ) { delete ref.parent; }
        if ( typeof(ref.next) !== STR.undefined ) { delete ref.next; }
        if ( typeof(ref.prev) !== STR.undefined ) { delete ref.prev; }
        if ( ref._element ) {
            let data = ref._element;
            delete ref._element;
            Object.assign(ref, data);
        }
    });
    return toSource(obj);
}

module.exports = function (html) {
    let parsed = nodesToString(HL.Node.fromString(html));

    console.log('--TPL:\n\n', html, '\n');
    console.log('--NODE:\n\n', parsed, '\n');

    //return utils.formatStr(html);
    return parsed;
};
