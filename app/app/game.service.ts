//imports
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';

//requires
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

@Injectable()
export class GameService {

    //will be passed in somehow from dashboard
    private _gameId: string = "game_1234";

    private _uid: string;

    constructor() {
        var config = {
            apiKey: "AIzaSyBWteIXPmEyjcpELIukCD7ZVaE5coXoMYI",
            authDomain: "uno-card-game-7dbd0.firebaseapp.com",
            databaseURL: "https://uno-card-game-7dbd0.firebaseio.com",
            storageBucket: "uno-card-game-7dbd0.appspot.com",
            messagingSenderId: "566146632667"
        };
        firebase.initializeApp(config);
    }

    auth(): void {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this._uid = user.uid;
                this.getGame();
            }
            else {
                var provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithRedirect(provider);
            }
        });
    }

    private getGame(): void {
        firebase.database().ref(this._gameId + "/players/" + this._uid).once('value').then(function (snapshot) {
            console.log(snapshot.val());
        })
    }
}