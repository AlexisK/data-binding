import { iterateDom } from "./utils/iterate-dom";
import { subscribeEventLoopUpdate } from "./event-loop-update";
import { storage } from './storage.service';
import { renderService } from "./render.service";


const reVariables = /\{\{([\s\d\w:'",.\/-_=+~]*)}}/gi;
const reNameTest  = /this.([\w\d]+)/gi;

export class Component {


    // startup
    constructor() {
        this.__target       = null;
        this._attrs         = {};
        this._hookInterval  = null;
        this._eventWorkers  = {};
        // these are set with webpack custom loader 'data-bind-loader'
        this.__name         = null;
        this.__selector     = null;
        this.__template     = null;
        this.__updateMethod = null;
    }

    init(ref) {
        this._ref        = ref;
        this.__checks    = {};
        this.__checksFor = {};
        this._ref.emit   = this.emit.bind(this);
        this._initUpdateSubscribe();
    }

    subscribeEvent(name, worker) {
        this._eventWorkers[name] = this._eventWorkers[name] || [];
        this._eventWorkers[name].push(worker)
    }

    emit(key, val) {
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
        Object.keys(this._ref).forEach(key => {
            if ( key[0] !== '_' ) {
                this._attrs[key] = this._ref[key];
                this._ref.__defineGetter__(key, () => this._attrs[key]);
                this._ref.__defineSetter__(key, (v) => {
                    this._attrs[key] = v;
                    this._updateData(key);
                });
            }
        });
    }

    _generateHookProps() {
        Object.keys(this._ref).forEach(key => {
            if ( key[0] !== '_' ) {
                this._attrs[key] = this._ref[key];
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


    // triggers
    _blankUpdate() {
        Object.keys(this._attrs).forEach(key => {
            if ( key[0] !== '_' ) {
                this._updateData(key);
            }
        });
    }


    _recalcReferences() {
        this.__target.innerHTML = this.__template;

        this.__checks = renderService.normalize(this.__target);

        renderService.render(this.__target, this._ref);
        this._blankUpdate();
    }


    _createSelf(target) {
        this.__target      = target;
        target.__component = this;
        this._recalcReferences();
    }


    // update process
    _updateData(key) {
        //if ( this.__checksFor[key] ) {
        //    this.__checksFor[key].forEach(this._renderFor.bind(this._ref));
        //}
        if ( this.__checks[key] ) {
            this.__checks[key].forEach(dom => {
                renderService.render(dom, this._attrs)
            });
        }
    }

}
