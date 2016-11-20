//imports
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { GameState } from '../app/game-state.model'
import { CardModel } from '../app/card.model';

//requires
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

@Injectable()
export class FirebaseService {

    //will be passed in somehow from dashboard
    private _gameId: string = "game_1234";
    private _playerId: string = "lcSyk6JsAMcuDrnOIrX06vKA5MD3";

    private _currentPlayer: Observable<string>;
    private _currentPlayerSource: BehaviorSubject<string>;

    private _playerHand: Observable<CardModel>;
    private _playerHandSource: BehaviorSubject<CardModel>;

    private _gameState: Observable<any>;
    private _gameStateSource: BehaviorSubject<any>;

    private _newGameState: GameState;


    constructor() {
        this._currentPlayerSource = new BehaviorSubject<string>("-1");
        this._currentPlayer = this._currentPlayerSource.asObservable();

        this._playerHandSource = new BehaviorSubject<CardModel>(null);
        this._playerHand = this._playerHandSource.asObservable();

        this._gameStateSource = new BehaviorSubject<any>(null);
        this._gameState = this._gameStateSource.asObservable();

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


    //set up the listener for player change in firebase
    init(): void {
        firebase.database().ref(this._gameId + "/gameState")
            .on('value', snapshot => {
                this._gameStateSource.next(snapshot.val());
            });
        firebase.database().ref(this._gameId + "/players/" + this._playerId + "/hand")
            .on('child_added', snapshot => {
                this._playerHandSource.next(snapshot.val() as CardModel);
            });
    }

    /* 
        DRAW CARD
    */
    drawCardForCurrentUser(): void {
        console.log("drawing card....");
        firebase.database().ref(this._gameId + "/deck")
            .once('value')
            .then(snapshot => this.updatePlayerHand(snapshot.val()));
    }

    updatePlayerHand(deck): void {
        let cards: Object[] = Object.keys(deck).map(key => deck[key]);
        cards.sort((a: any, b: any) => {
            if (a.deckOrder < b.deckOrder) return -1;
            if (a.deckOrder > b.deckOrder) return 1;
            return 0;
        });
        let card: any = cards.pop();
        card.rendered = false;
        let updates: Object = {};
        updates[this._gameId + "/deck/" + card.id] = null;
        updates[this._gameId + "/players/" + this._playerId + "/hand/" + card.id] = card;
        updates[this._gameId + "/public/move"] = new Date().toLocaleString();


        //// get actual number in hand
        updates[this._gameId + "/public/players/" + this._playerId + "/cardsInHand"] = 5;
        firebase.database().ref()
            .update(updates, snapshot => this._currentPlayerSource.next(this._playerId));
    }

    /* 
        PLAYS
    */

    playCard(card: CardModel, newHandCount: number): void {
        let update: Object = {};
        update[this._gameId + "/players/" + this._playerId + "/hand/" + card.id] = null;
        update[this._gameId + "/gameState/cardInPlay"] = card;
        update[this._gameId + "/gameState/players/" + this._playerId + "/cardsInHand"] = newHandCount;
        //// dev - make current player logic
        update[this._gameId + "/currentPlayer"] = this._currentPlayerSource.value == "JLNl39V9SZc1ri8FXe7bVCFbyBN2" ?
            "lcSyk6JsAMcuDrnOIrX06vKA5MD3" : "JLNl39V9SZc1ri8FXe7bVCFbyBN2";
        firebase.database().ref().update(update);
    }

    // redundant with above except for card in play
    pass(playerHand: Object): void {
        let update: Object = {};
        update[this._gameId + "/players/" + this._playerId + "/hand"] = playerHand;

        //// dev - make current player logic
        update[this._gameId + "/currentPlayer"] = this._currentPlayerSource.value == "JLNl39V9SZc1ri8FXe7bVCFbyBN2" ?
            "lcSyk6JsAMcuDrnOIrX06vKA5MD3" : "JLNl39V9SZc1ri8FXe7bVCFbyBN2";
        firebase.database().ref().update(update);
    }

    //GET SET

    get currentPlayer(): Observable<string> {
        return this._currentPlayer;
    }

    get playerHand(): Observable<CardModel> {
        return this._playerHand;
    }

    get playerId(): string {
        return this._playerId;
    }

    get gameState(): Observable<any> {
        return this._gameState;
    }
}