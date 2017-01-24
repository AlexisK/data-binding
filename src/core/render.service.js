import { breakStringToExec } from "./utils/break-string-to-exec";
const CHECK = {
    reTextVariables   : /\{\{([\s\d\w:'",.\/-_=+~]*)}}/gi,
    textVarCheck      : '{{',
    textVarCheckClose : '}}',
    errorParsing      : '{{ERR}}'
};

export class RenderService {

    constructor() {
        this.defaultContext          = window;
        this.renderWorkersBinding    = {
            1 : this.renderWorker_element.bind(this),
            3 : this.renderWorker_text.bind(this),
            8 : this.renderWorker_comment.bind(this)
        };
        this.normalizeWorkersBinding = {
            1 : this.normalizeWorker_element.bind(this),
            3 : this.normalizeWorker_text.bind(this),
            8 : this.normalizeWorker_comment.bind(this)
        };
    }

    static iterate(parent, callback) {
        Array.from(parent.childNodes).forEach(callback);
    }


    //                |
    // render process |
    //                |
    render(target, context = this.defaultContext) {
        let worker = this.renderWorkersBinding[target.nodeType];
        if ( worker ) {
            worker(target, context);
        }
    }

    renderWorker_text(dom, context) {
        if ( dom.__render ) {
            dom.__render(context);
        }
    }

    renderWorker_comment(dom, context) {}

    renderWorker_element(target, context) {
        RenderService.iterate(target, dom => {
            this.render(dom, context);
        });
    }


    //                             |
    // normalize (prepare) process |
    //                             |
    normalize(target, variablesMapping = {}) {

        RenderService.iterate(target, dom => {
            let worker = this.normalizeWorkersBinding[dom.nodeType];
            if ( worker ) {
                worker(dom, variablesMapping);
            }
        });

        return variablesMapping;
    }

    normalizeWorker_text(dom, variablesMapping) {
        if ( dom.textContent.indexOf(CHECK.textVarCheck) >= 0 ) {
            let stringExec = breakStringToExec(dom.textContent);
            stringExec.usedVariables.forEach(key => {
                variablesMapping[key] = variablesMapping[key] || [];
                variablesMapping[key].push(dom);
            });

            dom.__render    = ctx => {
                return dom.textContent = stringExec(ctx);
            };
            window.__render = dom.__render;
        }
    }

    normalizeWorker_comment(dom, variablesMapping) {}

    normalizeWorker_element(dom, variablesMapping) {
        this.normalize(dom, variablesMapping);
    }
}

export const renderService = new RenderService();
