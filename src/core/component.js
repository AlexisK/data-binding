import { iterateDom } from "./utils/iterate-dom";
import { forEach } from "./utils/for-each";
import { subscribeEventLoopUpdate } from "./event-loop-update";
import { storage } from './storage.service';
import { renderService } from "./render.service";
import { cloneContext } from "./utils/clone-context";
import { evalExpression } from "./utils/eval-expression";

export class Component {


    // startup
    constructor() {
        this.__target           = null;
        this._attrs             = {};
        this._hookInterval      = null;
        this._eventWorkerParams = {};
        this._renderSession     = null;
        // these are set with webpack custom loader 'data-bind-loader'
        this.__name             = null;
        this.__selector         = null;
        this.__template         = null;
        this.__updateMethod     = null;

        //v8
        this._ref     = null;
        this.__checks = {};

        this.updateMethodsMap = [
            this._updateSubscribe_property.bind(this),
            this._updateSubscribe_hook.bind(this),
            this._updateSubscribe_constant.bind(this)
        ];
    }

    init(ref) {
        //console.log('component', this.__name);
        this._ref             = ref;
        this._attrs.__proto__ = ref;
        this.__checks         = {};
        this._ref.emit        = this.emit.bind(this);
        this._initUpdateSubscribe();
    }

    subscribeEventParams(name, bundle) {
        this._eventWorkerParams[name] = this._eventWorkerParams[name] || [];
        this._eventWorkerParams[name].push(bundle);
    }

    emit(key, val) {
        console.log('EMIT!', key, val);
        if ( this._eventWorkerParams[key] ) {
            this._eventWorkerParams[key].forEach(([ctx, expr, cmp, vars]) => {
                let lCtx       = cloneContext(ctx);
                lCtx['$event'] = val;
                evalExpression(lCtx, expr);
                cmp.updateByVars(vars);
            });
        }
    }

    test() {
        console.log('Testing', this.__name, this.__selector);
    }


    // updateMethods
    _initUpdateSubscribe() {
        this.updateMethodsMap[this.__updateMethod]();
    }

    _updateSubscribe_property() {
        this._generateProps();
    }

    _updateSubscribe_hook() {
        this._generateHookProps();
    }

    _updateSubscribe_constant() {
        this._generateProps();
        subscribeEventLoopUpdate(this._blankUpdate.bind(this));
    }


    _generateProps() {
        forEach(this._ref, (val, key) => {
            if ( key[0] !== '_' ) {
                this._attrs[key] = val;
                this._ref.__defineGetter__(key, () => this._attrs[key]);
                this._ref.__defineSetter__(key, (v) => {
                    this._attrs[key] = v;
                    this._updateData(key);
                });
            }
        });
    }

    _generateHookProps() {
        forEach(this._ref, (val, key) => {
            if ( key[0] !== '_' ) {
                this._attrs[key] = val;
                this._ref.__defineGetter__(key, () => {
                    clearInterval(this._hookInterval);
                    this._hookInterval = setTimeout(() =>
                        this._updateData(key), 1);
                    return this._attrs[key];
                });
                this._ref.__defineSetter__(key, (v) => {
                    this._attrs[key] = v;
                });
            }
        });
    }


    _forceUpdate() {
        this._renderSession.updateables.forEach(ref => ref._update());
    }

    _blankUpdate() {
        forEach(this._attrs, (val, key) => {
            if ( key[0] !== '_' ) {
                this._updateData(key);
            }
        });
    }

    _updateData(key) {
        // TODO: this._checks if better
        //console.log(this._renderSession.checks);
        if ( this._renderSession.checks[key] ) {
            this._renderSession.checks[key].forEach(params => {
                this._renderSession.update(params);
            });
        }
    }

    updateByVars(list) {
        //console.log('updateByVars', list, this.__checks);
        list.forEach(v => this._updateData(v));
    }

    updateByVarsInExpression(expr) {
        let match;
        while (match = /this.([\w\d]+)/gi.exec(expr)) {
            this._updateData(match[1]);
        }
    }

    _createSelf(target, isChild) {
        this.__target      = target;
        target.__component = this;
        this._recalcReferences(isChild);
    }

    _recalcReferences(isChild) {
        this._renderSession = renderService.render(this, isChild);
        this._forceUpdate();
    }
}
