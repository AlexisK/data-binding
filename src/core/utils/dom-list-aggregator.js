import { logException } from "./log-exception";

export class DomListAggregator {

    constructor(params = {}) {
        this._onCreate = params.onCreate;
        this._onDelete = params.onDelete || function () {};
        this._onInsert = params.onInsert || function () {};

        this._domItems             = [];
        this._oldList              = [];
        this.rootElement           = document.createElement('div');
        this.rootElement.className = 'dom-list-aggregator';

        if ( params.anchor ) {
            this.setAnchor(params.anchor);
        }
    }

    setAnchor(anchor) {
        this.anchor                  = anchor;
        this.rootElement._parentNode = this.anchor;
    }

    checkValidity(args) {
        if ( !this.anchor ) {
            logException('No anchor for DomListAggregator', {ref : this});
            return false;
        }
        if ( !this._onCreate ) {

            logException('No onCreate for DomListAggregator', {ref : this});
            return false;
        }
        return true;
    }

    calcFirstIndex(newList) {
        if ( !newList || !this._oldList ) { return 0; }
        let i = 0;
        newList[0] = newList[0] || true;// V8
        for (; i < newList.length; i++) {
            if ( newList[i] !== this._oldList[i] ) {
                return i;
            }
        }
        return i;
    }

    fetchWorker_create(newDomItems, data) {
        let newNode         = this._onCreate(data);
        newNode._parentNode = this.rootElement;
        if ( !newNode.parentNode ) {
            this.rootElement.appendChild(newNode);
        }

        this.fetchWorker_final(newDomItems, newNode, data);

        return true;
    }

    fetchWorker_find(newDomItems, data) {
        let ind = this._oldList.indexOf(data);

        if ( !~ind ) {
            return false;
        }

        this._oldList.splice(ind, 1);
        let newNode = this._domItems.splice(ind, 1)[0];
        this.rootElement.appendChild(newNode);

        this.fetchWorker_final(newDomItems, newNode, data);

        return true;
    }

    fetchWorker_final(newDomItems, newNode, data) {
        newDomItems.push(newNode);
        this._onInsert(newNode, data);
    }

    fetchWorker(newDomItems, data) { // DEOPTIMIZED
        return this.fetchWorker_find(newDomItems, data) || this.fetchWorker_create(newDomItems, data);
    }

    fetch(newList) {
        if ( !this.checkValidity() ) {
            return 0;
        }
        newList[0] = newList[0] || true;// V8

        //TODO: create full diff instead of skipping same elements at the beginning
        let startIndex     = this.calcFirstIndex(newList);
        let detachRequired = (newList.length - startIndex) > 0;

        if ( detachRequired && this.rootElement.parentNode ) {
            this.rootElement.parentNode.removeChild(this.rootElement);
        }

        let newDomItems = [];
        for (var i = startIndex; i < newList.length; i++) {
            this.fetchWorker(newDomItems, newList[i]);
        }

        let savedItems = this._domItems.splice(0, startIndex);

        this._domItems.forEach(node => {
            this._onDelete(node);
            if ( node.parentNode === this.rootElement ) {
                this.rootElement.removeChild(node);
            }
        });

        this._domItems = [...savedItems, ...newDomItems];
        this._oldList  = newList.slice();

        if ( detachRequired && this.anchor.parentNode ) {
            this.anchor.parentNode.insertBefore(this.rootElement, this.anchor);
        }
    }
}

window.DomListAggregator = DomListAggregator;

/*
 let anchor = document.createComment('anchor_1');
 document.body.appendChild(anchor);

 let parent = new DomListAggregator({anchor,
 onCreate: data => {
 console.log('Create with: ', data);
 let newNode = document.createElement('h2');
 newNode.textContent = data.toUpperCase();
 return newNode;
 },
 onDelete: node => console.log('Deleting: ', node)
 });

 parent.fetch(['Hello', 'ololo', 'qweqwe', 'nana']);
 parent.fetch(['Hello', '123', 'qweqwe', 'nana2']);
 */