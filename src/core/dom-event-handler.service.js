import { evalExpression } from "./utils/eval-expression";
import { forEach } from './utils/for-each';

export class DomEventHandlerService {
    constructor() {
        this._queue    = [];
        this.isDynamic = false;

        this.rules = {
            onclick  : (target, ctx, template) => { this.defaultWorker(target, 'click', ctx, template._bindDom.onclick);},
            onchange : (target, ctx, template) => { this.defaultWorker(target, 'keyup', ctx, template._bindDom.onchange);}
        };

        // delay subscription
        setTimeout(this.runQueue.bind(this), 250);
    }

    runQueue() {
        this.isDynamic = true;
        this._queue.forEach(this._defaultWorker);
    }

    defaultWorker(target, evName, ctx, expr) {
        if ( this.isDynamic ) {
            this._defaultWorker([target, evName, ctx, expr]);
        } else {
            this._queue.push([target, evName, ctx, expr]);
        }
    }

    _defaultWorker([target, evName, ctx, expr]) {
        target.addEventListener(evName, function (ev) {
            ctx['$event'] = ev;
            evalExpression(ctx, expr);
        })
    }

    subscribeDom(target, ctx, template) {
        if ( template._bindDom ) {
            forEach(template._bindDom, (expr, evName) => {
                this.rules[evName](target, ctx, template);
            });
        }
    }
}

export const domEventHandlerService = new DomEventHandlerService();
