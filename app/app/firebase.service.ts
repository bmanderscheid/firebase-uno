//imports
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { GameState } from '../app/game-state.model'
import { CardModel } from '../app/card.model';
import { GameModel } from '../app/game.model';

//requires
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

@Injectable()
export class FirebaseService {

    //will be passed in somehow from dashboard
    private _gameId: string = "game_1234";

    // move to game service!!!
    private _playerId: string;

    private _playerHand: Observable<CardModel>;
    private _playerHandSource: BehaviorSubject<CardModel>;

    private _gameState: Observable<any>;
    private _gameStateSource: BehaviorSubject<any>;

    constructor() {
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

    // should come in via dashboard / log in
    auth(): void {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this._playerId = user.uid;
                this.init();

            }
            else {
                var provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithRedirect(provider);
            }
        });
    }


    getGame(): Promise<GameModel> {
        return firebase.database().ref(this._gameId + "/gameData")
            .once('value', snapshot => snapshot.val() as GameModel);
    }

    init(): void {
        firebase.database().ref(this._gameId + "/gameState")
            .on('value', snapshot => {
                this._gameStateSource.next(snapshot.val());
            });
        firebase.database().ref(this._gameId + "/playerHands/" + this._playerId)
            .on('child_added', snapshot => {
                this._playerHandSource.next(snapshot.val() as CardModel);
            });
    }

    /* 
        DRAW CARD
    */
    drawCard(): void {
        firebase.database().ref(this._gameId + "/deck")
            .once('value')
            .then(snapshot => this.updatePlayerHandAfterDraw(snapshot.val()));
    }

    updatePlayerHandAfterDraw(deck): void {
        let cards: Object[] = Object.keys(deck).map(key => deck[key]);
        cards.sort((a: any, b: any) => {
            if (a.deckOrder < b.deckOrder) return -1;
            if (a.deckOrder > b.deckOrder) return 1;
            return 0;
        });
        let card: any = cards.pop();

        let updates: Object = {};
        updates[this._gameId + "/deck/" + card.id] = null;
        updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = card;
        updates[this._gameId + "/gameState/lastMoveType"] = "draw";
        firebase.database().ref()
            .update(updates, () => this.updatePlayerCardsInHand());
    }

    updatePlayerCardsInHand(): void {
        let ref: any = firebase.database().ref(this._gameId + "/gameState/players/" + this._playerId);
        ref.once('value')
            .then(snapshot => ref.update({ cardsInHand: snapshot.val().cardsInHand + 1 }));
    }

    /* 
        PLAYS
    */

    playCard(card: CardModel, newHandCount: number): void {
        let updates: Object = {};
        updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = null;
        updates[this._gameId + "/gameState/cardInPlay"] = card;
        updates[this._gameId + "/gameState/players/" + this._playerId + "/cardsInHand"] = newHandCount;
        updates[this._gameId + "/gameState/currentPlayer"] = this._gameStateSource.value.currentPlayer == 0 ? 1 : 0;
        updates[this._gameId + "/gameState/lastMoveType"] = "play";
        firebase.database().ref().update(updates);
    }

    pass(): void {
        let update: Object = {};
        update[this._gameId + "/gameState/currentPlayer"] = this._gameStateSource.value.currentPlayer == 0 ? 1 : 0;
        update[this._gameId + "/gameState/lastMoveType"] = "pass";
        //// dev - make current player logic

        // change plager

        firebase.database().ref().update(update);
    }

    //GET SET

    // get currentPlayer(): Observable<string> {
    //     return this._currentPlayer;
    // }

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