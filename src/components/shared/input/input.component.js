import { Component } from "core/component";
require('./input.component.scss');

@Component({
    selector: 'app-input',
    template: './input.component.html'
})
export class InputComponent {
    constructor() {
        this.value = '';
    }

    onchange(ev) {
        this.emit('value', this.value = ev.target.value);
    }
}

