import { Component } from "core/component";

require('./retrieve-api-test.component.scss');

@Component({
    selector : 'retrieve-api-test',
    template : './retrieve-api-test.component.html'
})
export class RetrieveApiTestComponent {
    constructor() {
        this.users         = 'EpicGames, alexisk';
        this.repos         = [];
        this.usersInterval = null;
        this.debounce      = 500;
        this.retrieveData();
    }

    getEndpoint(userName) {
        return `https://api.github.com/users/${userName}/repos`;
    }

    retrieveData() {
        this.repos = [];
        this.users.split(/\s*\,\s*/).forEach(userName => {
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", ev => {
                if ( oReq.readyState === 4 ) {
                    this.handleResponse(oReq.responseText);
                }
            });
            oReq.open("GET", this.getEndpoint(userName));
            oReq.send();
        });

    }

    usersUpdated(usersList) {
        this.users = usersList;
        clearInterval(this.usersInterval);

        this.usersInterval = setTimeout(() => this.retrieveData(), this.debounce);
    }

    handleResponse(textData) {
        let data;
        try {
            data = JSON.parse(textData);
        } catch (err) {
            return console.error('Failed to get responce from', this.endpoint);
        }
        this.repos = this.repos.concat(data);
    }
}