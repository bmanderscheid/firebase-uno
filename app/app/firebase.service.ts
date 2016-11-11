//imports
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { GameState } from '../app/game-state.model'

//requires
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

@Injectable()
export class FirebaseService {

    //will be passed in somehow from dashboard
    private _gameId: string = "game_1234";
    private _uid: string;

    private _authenticated: Observable<boolean>;
    private _authenticatedSource: BehaviorSubject<boolean>;

    private _currentPlayer: Observable<string>;
    private _currentPlayerSource: BehaviorSubject<string>;

    private _newGameState:GameState;


    constructor() {
        this._authenticatedSource = new BehaviorSubject<boolean>(false);
        this._authenticated = this._authenticatedSource.asObservable();

        this._currentPlayerSource = new BehaviorSubject<string>("-1");
        this._currentPlayer = this._currentPlayerSource.asObservable();


        // move this shit?
        // synchronous
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
                this._authenticatedSource.next(true);
            }
            else {
                var provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithRedirect(provider);
            }
        });
    }

    //set up the listener for player change in firebase
    init(): void {
        firebase.database().ref(this._gameId + "/currentPlayer")
            .on('value', snapshot => this._currentPlayerSource.next(snapshot.val()));
    }

    // this will return a proper game state class that the service can decipher

    getGameState(): Promise<GameState> {
        this._newGameState = new GameState();
        return this.getHand();
    }

    getHand():Promise<GameState>{
        return firebase.database().ref(this._gameId + "/players/" + this._uid)
            .once('value')
            .then(snapshot => this.getPublic(snapshot.val().hand))
    }
    
    getPublic(hand: any[]): Promise<GameState> {
        this._newGameState.hand = hand;
        return firebase.database().ref(this._gameId + "/public")
            .once('value')
            .then(snapshot => this.completeGameState(snapshot.val().players))
    }

    completeGameState(v:Object):GameState{
        this._newGameState.players = v;
        return this._newGameState;
    }

    get authenticated(): Observable<boolean> {
        return this._authenticated;
    }

    get currentPlayer(): Observable<string> {
        return this._currentPlayer;
    }
}