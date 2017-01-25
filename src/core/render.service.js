import { breakStringToExec } from "./utils/break-string-to-exec";
import { evalExpression } from "./utils/eval-expression";
import { storage } from "./storage.service";
import { cloneContext } from "./utils/clone-context";
import { logException } from "./utils/log-exception";

const CHECK = {
    reNameTest        : /this.([\w\d]+)/gi,
    textVarCheck      : '{{',
    textVarCheckClose : '}}',
    errorParsing      : '{{ERR}}',
    attributeFor      : '*for',
    attributeEvent    : ['(', ')'],
    attributeInput    : ['[', ']'],
    event             : '$event',
    object            : 'object'
};

export class RenderService {

    constructor() {
        this.defaultContext = window;
        this.renderBinding  = {
            text : this._render_text.bind(this),
            tag  : this._render_tag.bind(this)
        }
    }


    static iterate(parent, callback) {
        Array.from(parent.childNodes).forEach(callback);
    }

    processContent(target) {
        RenderService.iterate(target, dom => {
            if ( dom.nodeType === 1 ) {
                let tag = dom.tagName.toLowerCase();

                if ( storage.component[tag] ) {
                    let component = new storage.component[tag]();
                    component.__component._createSelf(dom);
                }
            }
        });
    }


    render(target, ctx = this.defaultContext, template = []) {
        console.log(target, ctx, template);
        this._render(target, ctx, template);
    }

    _render(target, ctx, template) {
        if ( template.constructor === Array ) {
            template.forEach(tpl => this._render(target, ctx, tpl));
        } else if ( template.type && this.renderBinding[template.type] ) {
            this.renderBinding[template.type](target, ctx, template);
        } else {
            logException('Failed to render template', {target, ctx, template});
        }
    }

    _render_text(target, ctx, template) {
        target.appendChild(document.createTextNode(template.data));
    }

    _render_tag(target, ctx, template) {
        let newNode = document.createElement(template.name);
        Object.keys(template.attribs).forEach(key => {
            try {
                newNode.setAttribute(key, template.attribs[key]);
            } catch (err) {
                logException('Failed to set attribute ' + key, {
                    [key] : template.attribs[key],
                    newNode, target, ctx, template
                })
            }
        });
        target.appendChild(newNode);
        this._render(newNode, ctx, template.children);
    }

}

export const renderService = new RenderService();
