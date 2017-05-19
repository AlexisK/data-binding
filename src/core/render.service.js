import { evalExpression } from "./utils/eval-expression";
import { storage } from "./storage.service";
import { cloneContext } from "./utils/clone-context";
import { forEach } from "./utils/for-each";
import { logWarning, logException } from "./utils/log-exception";
import { ArrayDiff } from "./utils/array-diff";
import { DomListAggregator } from "./utils/dom-list-aggregator";
import { domEventHandlerService } from './dom-event-handler.service';

const CHECK = {
    event  : '$event',
    index  : '$index',
    object : 'object',
    anch   : 'anch',
    for    : 'for',
    text   : 'text',
    empty  : ''
};

const TPLTYPE = {
    text : 0,
    tag  : 1
};

export class RenderSession {

    constructor(component) {
        this._component  = component;
        this.parentNode  = component.__target;
        this.rootNode    = null;
        this.context     = component._attrs;
        this.template    = component.__template;
        this.checks      = component.__checks;
        this.updateables = [];
        //this.renderedTimes = {
        //    text      : 0,
        //    component : 0,
        //    element   : 0
        //};

        this._renderBinding = [function () {}, this._render_text.bind(this), this._render_tag.bind(this)];

    }

    createAnchor(target) {
        let newNode = document.createComment(CHECK.empty);
        target.appendChild(newNode);
        return newNode;
    }

    makeUpdateAble(target, worker) {
        target._children = [];
        target._update   = (ctx) => {
            worker(ctx);
            target._children.forEach(child => child._update());
        };
        for (let parent = target._parentNode || target.parentNode; parent; parent = parent._parentNode || parent.parentNode) {
            if ( parent._update ) {
                parent._children.push(target);
                break;
            }
        }
        this.updateables.push(target);
    }

    saveVariables(list, val) {
        if ( list ) {
            list.forEach(key => {
                this.checks[key] = this.checks[key] || [];
                this.checks[key].push(val);
            });
        }
    }

    update(params) {
        if ( params.node && params.node._update ) {
            params.node._update(params.ctx);
        }
    }

    render(isChild) {
        this.rootNode = document.createDocumentFragment();
        this._render(this.rootNode, this.context, this.template, true, false);

        if ( isChild ) {
            this.parentNode.appendChild(this.rootNode);
        } else {
            //console.log(this.template);
            setTimeout(() =>
                this.parentNode.appendChild(this.rootNode), 1);
        }
        //console.log('Rendered', this.renderedTimes);
    }


    _render(target, ctx, template, isTop, ignoreFor) {
        if ( template.constructor === Array ) {
            template.forEach(tpl => this._render(target, ctx, tpl, false, false));
        } else if ( template.type && this._renderBinding[template.type] ) {
            this._renderBinding[template.type](target, ctx, template, isTop, false);
        } else {
            logException('Failed to render template', {target, ctx, template});
        }
    }

    _render_text(target, ctx, template, isTop) {
        //this.renderedTimes.text++;

        if ( template._renderMap ) {
            let node         = document.createTextNode(CHECK.empty);
            node._parentNode = target;

            this.makeUpdateAble(node, (localContext = ctx) => {
                let result = [];
                template._renderMap.forEach(val => {
                    if ( val.constructor === Array ) {
                        result.push(evalExpression(localContext, val[0]));
                    } else {
                        result.push(val)
                    }
                });
                node.textContent = result.join(CHECK.empty);
            });

            this.saveVariables(template._renderVars, {node, ctx});
            target.appendChild(node);

        } else {
            target.appendChild(document.createTextNode(template.data));
        }
    }

    _render_tag(target, ctx, template, isTop, ignoreFor) {
        if ( template._for && !ignoreFor ) {
            return this._render_for(target, ctx, template, false, false);
        }
        if ( template._componentSelector ) {
            return this._render_component(target, ctx, template, isTop, false);
        }

        let newNode = this._render_element(target, ctx, template, isTop, false);
        this._render(newNode, ctx, template.children, false, false);

        domEventHandlerService.subscribeDom(newNode, this._component._ref, template);

        return newNode;
    }

    _render_element(target, ctx, template, isTop, ignoreFor) {
        //this.renderedTimes.element++;
        let newNode = document.createElement(template.name);
        template.attribs.forEach(pair => newNode[pair[0]] = pair[1]);
        target.appendChild(newNode);
        return newNode;
    }

    _render_for(target, ctx, template, isTop, ignoreFor) {
        let anchor     = this.createAnchor(target);
        let collection = new DomListAggregator({
            anchor,
            onCreate : val => {
                let localCtx = cloneContext(ctx);

                localCtx[template._for[0]] = val;
                return this._render_tag(collection.rootElement, localCtx, template, false, true);
            },
            onDelete : this._destroy.bind(this)
        });
        template._bindFor.forEach(v => {
            this.checks[v] = this.checks[v] || [];
            this.checks[v].push({node : anchor, ctx});
        });

        this.makeUpdateAble(anchor, (updCtx) => {
            updCtx     = updCtx || ctx;
            let source = evalExpression(updCtx, template._for[1]);
            collection.fetch(source);
        });

    }

    _render_component(target, ctx, template, isTop, ignoreFor) {
        //this.renderedTimes.component++;
        if ( isTop ) { return 0; }

        let component = new storage.component[template._componentSelector]();

        if ( template._bindings ) {
            forEach(template._bindings, (expr, key) => {
                component.__component.subscribeEventParams(key, [ctx, expr, this._component, template._bindVars[key]]);
            });
        }
        if ( template._inputs ) {
            forEach(template._inputs, (inp, key) => {
                component[key] = evalExpression(ctx, inp);
            });
        }

        component.__component._createSelf(target, true);
    }

    _destroy(node) {
        // TODO: clean-up memory and relations
        try {
            delete node._children;
            delete node._update;
            delete node._parentNode;
            node.parentNode.removeChild(node);
        } catch (err) {
            logWarning('Failed to remove node from DOM', {node});
        }
    }

}


export class RenderService {

    constructor() {
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
                } else {
                    this.processContent(dom);
                }
            }
        });
    }


    render(component, isChild) {
        let session = new RenderSession(component);
        session.render(isChild);
        return session;
    }

}

export const renderService = new RenderService();
