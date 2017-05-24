import { Component } from "core/component";

require('./retrieve-api-test.component.scss');

@Component({
    selector: 'retrieve-api-test',
    template: './retrieve-api-test.component.html'
})
export class RetrieveApiTestComponent {
    constructor() {
        this.endpoint = 'https://api.github.com/users/alexisk/repos';
        this.repos = [];
        this.retrieveData();
    }

    retrieveData() {
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", ev => {
            if ( oReq.readyState === 4 ) {
                this.handleResponse(oReq.responseText);
            }
        });
        oReq.open("GET", this.endpoint);
        oReq.send();
    }

    handleResponse(textData) {
        let data;
        try {
            data = JSON.parse(textData);
        } catch(err) {
            return console.error('Failed to get responce from', this.endpoint);
        }
        setTimeout(() => this.repos = data, 5000);
    }
}