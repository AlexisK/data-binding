import { Component } from "core/component";

@Component({
    selector : 'repo-item',
    template : './repo-item.component.html'
})
export class RepoItemComponent {
    constructor() {
        this.data = {};
    }
}
