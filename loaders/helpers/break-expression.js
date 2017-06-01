
const {reExpression, TYPE, OPERATOR, expressionMorph} = require('../config');


module.exports = function breakExpression(expr, startIndex = 0) {
    let workMap         = [];
    let isString        = false;
    let stringBuffer    = null;
    let isStringEscaped = false;
    let isExpression    = false;
    let exportIndex     = 0;


    let c, nextC;

    for (let i = startIndex, iN = startIndex + 1; i < expr.length; i++, iN++, exportIndex++) {
        c     = expr[i];
        nextC = expr[iN];

        //console.log(c);
        if ( isString ) {
            // check escaping in process
            if ( isStringEscaped ) {
                stringBuffer.push(c);
                isStringEscaped = false;
            } else {
                // check escape start
                if ( reExpression.reBSlash.test(c) ) {
                    isStringEscaped = true;
                } else {
                    // check string end
                    if ( reExpression.reQuote.test(c) ) {
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
            if ( reExpression.reQuote.test(c) ) {
                stringBuffer = [];
                isString     = true;
            } else {
                // checkWritingExpression
                if ( isExpression ) {
                    if ( !reExpression.reExpr.test(c) ) {
                        let localExpr = stringBuffer.join('');

                        if ( isNaN(localExpr) ) {
                            if ( reExpression.reDot.exec(localExpr) ) {
                                workMap.push([TYPE.expressionMap, localExpr.split(reExpression.reDot)]);
                            } else {
                                if ( expressionMorph[localExpr] ) {
                                    workMap.push([TYPE.number, expressionMorph[localExpr]]);
                                } else {
                                    workMap.push([TYPE.expression, localExpr]);
                                }
                            }
                        } else {
                            workMap.push([TYPE.number, parseFloat(localExpr)]);
                        }

                        isExpression = false;
                    } else {
                        stringBuffer.push(c);
                    }
                }
                // isExpression may change
                if ( !isExpression ) {
                    let cc = [c, nextC].join('');

                    if ( reExpression.reScopeClose.test(c) ) {
                        exportIndex++;
                        break;
                    } else if ( reExpression.reScopeOpen.test(c) ) {
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
                    if ( nextC && reExpression.reLogicOperator.test(cc) ) {
                        i++;
                        workMap.push([TYPE.operator, OPERATOR[cc]]);
                    } else if ( reExpression.reOperator.test(c) ) {
                        workMap.push([TYPE.operator, OPERATOR[c]]);
                    } else {
                        // check expr starts
                        if ( reExpression.reExpr.test(c) ) {
                            stringBuffer = [c];
                            isExpression = true;
                        }
                    }
                }

            }
        }

    }

    if ( isExpression ) {
        let localExpr = stringBuffer.join('');
        if ( isNaN(localExpr) ) {
            if ( reExpression.reDot.exec(localExpr) ) {
                workMap.push([TYPE.expressionMap, localExpr.split(reExpression.reDot)]);
            } else {
                if ( expressionMorph[localExpr] ) {
                    workMap.push([TYPE.number, expressionMorph[localExpr]]);
                } else {
                    workMap.push([TYPE.expression, localExpr]);
                }
            }
        } else {
            workMap.push([TYPE.number, parseFloat(localExpr)]);
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
