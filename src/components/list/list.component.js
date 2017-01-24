import { Component } from "core/component";

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
            }
        ];
        window.list = this;
    }

    addItem(title) {
        this.items.push({
            title, value: false
        });
    }
}