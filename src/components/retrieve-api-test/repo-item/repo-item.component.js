import { Component } from "core/component";
require('./repo-item.component.scss');

@Component({
    selector : 'repo-item',
    template : './repo-item.component.html'
})
export class RepoItemComponent {
    constructor() {
        this.data = {};
    }
}
