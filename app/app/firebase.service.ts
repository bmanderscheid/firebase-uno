//imports
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { GameStateChange } from '../app/game-state.model'
import { CardModel } from '../app/card.model';
import { GameModel } from '../app/game.model';
import { PlayerModel } from '../app/player.model';

//requires
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');

@Injectable()
export class FirebaseService {

    // move to game service!!!
    // currently being accessed to set in game service
    private _playerId: string;
    private _gameId: string = "game_1234";

    private _playerHand: Observable<CardModel>;
    private _playerHandSource: BehaviorSubject<CardModel>;

    // actually more of an ALL hand counts
    private _oppoentHandCount: Observable<any>;
    private _oppoentHandCountSource: BehaviorSubject<any>;

    private _cardInPlay: Observable<any>;
    private _cardInPlaySource: BehaviorSubject<any>;

    private _currentPlayerIndex: Observable<number>;
    private _currentPlayerIndexSource: BehaviorSubject<number>;

    constructor() {
        this._playerHandSource = new BehaviorSubject<CardModel>(null);
        this._playerHand = this._playerHandSource.asObservable();

        this._oppoentHandCountSource = new BehaviorSubject<any>(null);
        this._oppoentHandCount = this._oppoentHandCountSource.asObservable();

        this._cardInPlaySource = new BehaviorSubject<CardModel>(null);
        this._cardInPlay = this._cardInPlaySource.asObservable();

        this._currentPlayerIndexSource = new BehaviorSubject<number>(-1); // start an nobody's turn
        this._currentPlayerIndex = this._currentPlayerIndexSource.asObservable();

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
                console.log("DEBUG: auth changed, user in");
                if (!this._playerId) {
                    this._playerId = user.uid;
                    this.init();
                }
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
        firebase.database().ref(this._gameId + "/gameState/players") // chage players fb node name
            .on('value', snapshot => {
                this._oppoentHandCountSource.next(snapshot.val());
            });
        firebase.database().ref(this._gameId + "/gameState/currentPlayer") // change fb node to ...index
            .on('value', snapshot => {
                this._currentPlayerIndexSource.next(snapshot.val());
            });
        firebase.database().ref(this._gameId + "/gameState/cardInPlay")
            .on('value', snapshot => {
                this._cardInPlaySource.next(snapshot.val());
            });
        firebase.database().ref(this._gameId + "/playerHands/" + this._playerId)
            .on('child_added', snapshot => {
                this._playerHandSource.next(snapshot.val() as CardModel);
            });
    }

    /* 
        DRAW CARD
    */

    getDeck(): Promise<any> {
        return firebase.database().ref(this._gameId + "/deck")
            .once('value', snapshot => snapshot);
    }

    drawCard(): void {
        this.getDeck()
            .then(snapshot => this.updatePlayerHandAfterDraw(snapshot.val()))
    }

    drawMultipleCards(numCards: number): void {
        this.getDeck()
            .then(snapshot => this.updatePlayersHandAfterMultipleDraw(snapshot.val(), numCards));
    }

    updatePlayerHandAfterDraw(deck): void {
        let cards: Object[] = Object.keys(deck).map(key => deck[key]);  // turn deck into array
        cards = this.sortCards(cards); // order array by deck order
        let card: any = cards.pop();
        let updates: Object = {};
        updates[this._gameId + "/deck/" + card.id] = null;
        updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = card;
        console.log(updates);
        firebase.database().ref()
            .update(updates, () => this.updatePlayerCardsInHand());
    }

    updatePlayersHandAfterMultipleDraw(deck, numCards): void {
        let cards: Object[] = Object.keys(deck).map(key => deck[key]); // turn deck into array
        cards = this.sortCards(cards); // order array by deck order

        let updates: Object = {};
        for (let i = 0; i < numCards; i++) {
            let card: any = cards.pop();
            updates[this._gameId + "/deck/" + card.id] = null;
            updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = card;
        }
        firebase.database().ref()
            .update(updates, () => this.updatePlayerCardsInHand());
    }




    /* 
        PLAYS
    */

    playCard(card: CardModel): void {
        let moveType: string = card.opponentDraw ? "draw" + card.opponentDraw : "play";
        let updates: Object = {};
        updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = null;
        updates[this._gameId + "/gameState/cardInPlay"] = card;
        updates[this._gameId + "/gameState/currentPlayer"] = this._currentPlayerIndexSource.value == 0 ? 1 : 0;
        firebase.database().ref().update(updates, () => this.updatePlayerCardsInHand());
    }

    pass(): void {
        let update: Object = {};
        update[this._gameId + "/gameState/currentPlayer"] = this._cardInPlaySource.value.currentPlayer == 0 ? 1 : 0;
        update[this._gameId + "/gameState/lastMoveType"] = "pass";
        firebase.database().ref().update(update);
    }

    updatePlayerCardsInHand(): void {
        let ref: any = firebase.database().ref(this._gameId + "/playerHands/" + this._playerId);
        ref.once('value')
            //.then(snapshot => ref.update({ cardsInHand: Number(snapshot.val().cardsInHand) + numCards }));
            .then(snapshot =>
                firebase.database().ref(this._gameId + "/gameState/players/" + this._playerId)
                    .update({ cardsInHand: Object.keys(snapshot.val()).length }));
    }

    // UTILITY
    sortCards(cards: Object[]): Object[] {
        return cards.sort((a: any, b: any) => {
            if (a.deckOrder < b.deckOrder) return -1;
            if (a.deckOrder > b.deckOrder) return 1;
            return 0;
        });
    }

    //GET SET
    get playerHand(): Observable<CardModel> {
        return this._playerHand;
    }

    get oppoentHandCount(): Observable<any> {
        return this._oppoentHandCount;
    }

    get currentPlayerIndex(): Observable<number> {
        return this._currentPlayerIndex;
    }

    get playerId(): string {
        return this._playerId;
    }

    get cardInPlay(): Observable<CardModel> {
        return this._cardInPlay;
    }
}