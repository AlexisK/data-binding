import { evalExpression } from "./utils/eval-expression";
import { forEach } from './utils/for-each';

const rules = {
    onclick  : function (target, ctx, template) { defaultWorker(target, 'click', ctx, template._bindDom.onclick);},
    onchange : function (target, ctx, template) { defaultWorker(target, 'keyup', ctx, template._bindDom.onchange);}
};

function defaultWorker(target, evName, ctx, expr) {
    target.addEventListener(evName, function(ev) {
        ctx['$event'] = ev;
        evalExpression(ctx, expr);
    })
}

export class DomEventHandlerService {
    subscribeDom(target, ctx, template) {
        if ( template._bindDom ) {
            forEach(template._bindDom, (expr, evName) => {
                rules[evName](target, ctx, template);
            });
        }
    }
}

export const domEventHandlerService = new DomEventHandlerService();
