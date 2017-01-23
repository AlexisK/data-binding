import { Component } from "core/component";

@Component({
    selector: 'list-input',
    template: './list-input.component.html'
})
export class ListInputComponent {
    constructor() {
        this.value = '';
    }
}
