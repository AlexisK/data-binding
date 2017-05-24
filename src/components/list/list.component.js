import { Component } from "core/component";

require('./list.component.scss');

@Component({
    selector: 'list',
    template: './list.component.html',
    update: 'hook'
})
export class ListComponent {
    constructor() {
        this.items = [
            {
                title: 'item 1',
                value: false
            },
            {
                title: 'item 2',
                value: false
            },
            {
                title: 'item 3',
                value: true
            },
            {
                title: 'item 4',
                value: false
            }
        ];
        this.N = 10000;

        this.generateItems();
    }

    generateItems() {

        for ( let i = this.N; i --> 0; ) {
            this.items.push({
                title: i,
                value: false
            });
        }
    }

    addItem(title) {
        console.log(title, this);
        this.items.push({
            title, value: false
        });
    }

    removeItem(item) {
        let ind = this.items.indexOf(item);
        console.log(item, ind);
        if ( ind >= 0 ) {
            this.items.splice(ind, 1);
        }
    }
}