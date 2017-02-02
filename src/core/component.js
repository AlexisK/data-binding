import { iterateDom } from "./utils/iterate-dom";
import { forEach } from "./utils/for-each";
import { subscribeEventLoopUpdate } from "./event-loop-update";
import { storage } from './storage.service';
import { renderService } from "./render.service";

const CHECK = {
    reNameTest        : /this.([\w\d]+)/gi,
};

export class Component {


    // startup
    constructor() {
        this.__target       = null;
        this._attrs         = {};
        this._hookInterval  = null;
        this._eventWorkers  = {};
        this._renderSession = null;
        // these are set with webpack custom loader 'data-bind-loader'
        this.__name         = null;
        this.__selector     = null;
        this.__template     = null;
        this.__updateMethod = null;
    }

    init(ref) {
        this._ref        = ref;
        this._attrs.__proto__ = ref;
        this.__checks    = {};
        this.__checksFor = {};
        this._ref.emit   = this.emit.bind(this);
        this._initUpdateSubscribe();
    }

    subscribeEvent(name, worker) {
        //console.log(name, '\n', this);
        this._eventWorkers[name] = this._eventWorkers[name] || [];
        this._eventWorkers[name].push(worker)
    }

    emit(key, val) {
        console.log('EMIT!', key, val);
        if ( this._eventWorkers[key] ) {
            this._eventWorkers[key].forEach(worker => {
                worker(val);
            });
        }
    }

    test() {
        console.log('Testing', this.__name, this.__selector);
    }


    // updateMethods
    _initUpdateSubscribe() {
        this['_updateSubscribe_' + this.__updateMethod]();
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
        if ( this.__checks[key] ) {
            this.__checks[key].forEach(params => {
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
        while( match = CHECK.reNameTest.exec(expr) ) {
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
