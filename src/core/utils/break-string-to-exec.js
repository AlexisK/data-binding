import { evalExpression } from "./eval-expression";
const CHECK = {
    function          : 'function',
    textVarCheck      : '{{',
    textVarCheckClose : '}}',
    reNameTest        : /this.([\w\d]+)/gi
};


export function breakStringToExec(str) {
    let parseMap      = [];
    let usedVariables = [];

    for (let i = 0, mode = false; i < str.length;) {
        if ( mode ) {
            let ind = str.indexOf(CHECK.textVarCheckClose, i);
            if ( ind === -1 ) { ind = str.length; }
            let ex = str.slice(i, ind);
            let match;
            while (match = CHECK.reNameTest.exec(ex)) {
                if ( usedVariables.indexOf(match[1]) === -1 ) {
                    usedVariables.push(match[1]);
                }
            }

            parseMap.push(ctx => { return evalExpression(ctx, ex); });
            i = ind + CHECK.textVarCheckClose.length;
        } else {
            let ind = str.indexOf(CHECK.textVarCheck, i);
            if ( ind === -1 ) { ind = str.length; }
            parseMap.push(str.slice(i, ind));
            i = ind + CHECK.textVarCheck.length;
        }
        mode = !mode;
    }

    let result           = function (ctx) {
        let result = [];
        parseMap.forEach(v => {
            if ( typeof(v) === CHECK.function ) {
                result.push(v(ctx));
            } else {
                result.push(v);
            }
        });
        return result.join('');
    };
    result.usedVariables = usedVariables;
    return result;
}
