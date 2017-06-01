const config_general = {
    CHECK : {
        reNameTest            : /(\w[\w\d]*)/gi,
        renderContentStart    : '{{',
        renderContentEnd      : '}}',
        attributeBindingStart : '(',
        attributeBindingEnd   : ')',
        attributeInputStart   : '[',
        attributeInputEnd     : ']',
        domEvents             : ['onclick', 'onchange'],
    },
    STR   : {
        object     : 'object',
        undefined  : 'undefined',
        string     : 'string',
        checkFor   : '*for',
        checkIf    : '*if',
        tag        : 'tag',
        text       : 'text',
        _bindings  : '_bindings',
        _bindVars  : '_bindVars',
        _inputs    : '_inputs',
        _inputVars : '_inputVars',
        xeq        : 'x = ',
        q          : "'",
        mark       : '!',
        slash      : '/',
        space      : ' ',
        utf        : 'utf8',
        empty      : ''
    }
};

const config_eval = {
    reExpression: {
        reSpace         : /\s/,
        reNotSpace      : /\S/,
        reOperator      : /[\+\-\/\*\%=]/,
        reLogicOperator : /(?:&&|\|\||==)/,
        reExpr          : /[$\w\d\.]/i,
        reScopeOpen     : /\(/,
        reScopeClose    : /\)/,
        reQuote         : /'/,
        reBSlash        : /\\/,
        reDot           : /\./
    },
    TYPE            : {
        constant      : 0,
        string        : 1,
        operator      : 2,
        expression    : 3,
        expressionMap : 4,
        scope         : 5,
        number        : 6,
        function      : 7
    },
    OPERATOR        : {
        '+'  : 1,
        '-'  : 2,
        '*'  : 3,
        '/'  : 4,
        '%'  : 5,
        '&&' : 6,
        '||' : 7,
        '==' : 8,
        '='  : 9
    },
    expressionMorph : {
        true      : 1,
        false     : 0,
        null      : 0,
        undefined : 0,
        NaN       : 0,
        Infinity  : 1
    }
};

const config_dom = {
    updateMethodInds: {
        'property' : 0,
        'hook'     : 1,
        'constant' : 2
    },
    NSRules           : {
        'http://www.w3.org/2000/svg' : 'svg,path'.split(',')
    },
    attributesMapping : {
        html : {
            class : 'className'
        },
        ns   : {
            viewbox : 'viewBox'
        }
    }
};

module.exports = Object.assign({}, config_general, config_eval, config_dom);
