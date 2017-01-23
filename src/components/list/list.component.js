import { Component } from "core/component";

@Component({
    selector: 'list',
    template: './list.component.html'
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
}