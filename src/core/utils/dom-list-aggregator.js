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

    fetch(newList) {
        if ( !this.checkValidity() ) {
            return 0;
        }
        if ( this.rootElement.parentNode ) {
            this.rootElement.parentNode.removeChild(this.rootElement);
        }

        let newDomItems = [];
        newList.forEach((data, i) => {
            let ind = this._oldList.indexOf(data);
            let newNode;

            if ( ind >= 0 ) {
                this._oldList.splice(ind, 1);
                newNode = this._domItems.splice(ind, 1)[0];
                this.rootElement.appendChild(newNode);
            } else {
                newNode             = this._onCreate(data, i);
                newNode._parentNode = this.rootElement;
                if ( !newNode.parentNode ) {
                    this.rootElement.appendChild(newNode);
                }
            }

            newDomItems.push(newNode);
            this._onInsert(newNode, data);
        });

        this._domItems.forEach(node => {
            this._onDelete(node);
            this.rootElement.removeChild(node);
        });

        this._domItems = newDomItems;
        this._oldList  = newList.slice();

        if ( this.anchor.parentNode ) {
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