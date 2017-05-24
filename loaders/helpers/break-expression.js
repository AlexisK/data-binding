const G = {
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
};

const TYPE = {
    string        : 1,
    operator      : 2,
    expression    : 3,
    expressionMap : 4,
    scope         : 5,
    number        : 6,
    function      : 7
};

const OPERATOR = {
    '+'  : 1,
    '-'  : 2,
    '*'  : 3,
    '/'  : 4,
    '%'  : 5,
    '&&' : 6,
    '||' : 7,
    '==' : 8,
    '='  : 9
};

module.exports = function breakExpression(expr, startIndex = 0) {
    let workMap         = [];
    let isString        = false;
    let stringBuffer    = null;
    let isStringEscaped = false;
    let isExpression    = false;
    let exportIndex     = 0;


    let c, nextC;

    for (let i = startIndex, iN = startIndex +1; i < expr.length; i++, iN++, exportIndex++) {
        c = expr[i];
        nextC = expr[iN];

        //console.log(c);
        if ( isString ) {
            // check escaping in process
            if ( isStringEscaped ) {
                stringBuffer.push(c);
                isStringEscaped = false;
            } else {
                // check escape start
                if ( G.reBSlash.test(c) ) {
                    isStringEscaped = true;
                } else {
                    // check string end
                    if ( G.reQuote.test(c) ) {
                        workMap.push([TYPE.string, stringBuffer.join('')]);
                        isString = false;
                    } else {
                        // writing
                        stringBuffer.push(c);
                    }
                }
            }
        } else {
            // check string starts
            if ( G.reQuote.test(c) ) {
                stringBuffer = [];
                isString     = true;
            } else {
                // checkWritingExpression
                if ( isExpression ) {
                    if ( !G.reExpr.test(c) ) {
                        let expr = stringBuffer.join('');

                        if ( isNaN(expr) ) {
                            if ( G.reDot.exec(expr) ) {
                                workMap.push([TYPE.expressionMap, expr.split(G.reDot)]);
                            } else {
                                workMap.push([TYPE.expression, expr]);
                            }
                        } else {
                            workMap.push([TYPE.number, parseFloat(expr)]);
                        }

                        isExpression = false;
                    } else {
                        stringBuffer.push(c);
                    }
                }
                // isExpression may change
                if ( !isExpression ) {
                    let cc   = [c, nextC].join('');

                    if ( G.reScopeClose.test(c) ) {
                        exportIndex++;
                        break;
                    } else if ( G.reScopeOpen.test(c) ) {
                        let scopeExpression = breakExpression(expr, i + 1);
                        i += scopeExpression.exportIndex + 1;
                        exportIndex += scopeExpression.exportIndex + 1;

                        let checkWM = workMap[workMap.length - 1];
                        if ( checkWM && checkWM[0] === TYPE.expression ) {
                            checkWM[0] = TYPE.function;
                        }
                        workMap.push([TYPE.scope, scopeExpression.workMap]);
                    } else

                    // check operators
                    if ( nextC && G.reLogicOperator.test(cc) ) {
                        i++;
                        workMap.push([TYPE.operator, OPERATOR[cc]]);
                    } else if ( G.reOperator.test(c) ) {
                        workMap.push([TYPE.operator, OPERATOR[c]]);
                    } else {
                        // chack expr starts
                        if ( G.reExpr.test(c) ) {
                            stringBuffer = [c];
                            isExpression = true;
                        }
                    }
                }

            }
        }

    }

    if ( isExpression ) {
        let expr = stringBuffer.join('');
        if ( isNaN(expr) ) {
            if ( G.reDot.exec(expr) ) {
                workMap.push([TYPE.expressionMap, expr.split(G.reDot)]);
            } else {
                workMap.push([TYPE.expression, expr]);
            }
        } else {
            workMap.push([TYPE.number, parseFloat(expr)]);
        }
    }

    //if ( !startIndex ) {
    //    console.log('\n');
    //    console.log(expr);
    //    console.log(workMap);
    //}
    return {
        workMap,
        exportIndex
    };
};
