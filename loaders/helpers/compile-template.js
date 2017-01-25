const HL = require('node-html-light');
const utils = require('./utils');

module.exports = function(html) {
    let nodes = HL.Node.fromString(html);

    console.log('--TPL:\n\n', html, '\n');
    console.log('--NODE:\n\n', utils.nodesToString(nodes), '\n');

    return utils.formatStr(html);
    //return utils.nodesToString(nodes);
};
