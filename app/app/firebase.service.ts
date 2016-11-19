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

    private _authenticated: Observable<boolean>;
    private _authenticatedSource: BehaviorSubject<boolean>;

    private _currentPlayer: Observable<string>;
    private _currentPlayerSource: BehaviorSubject<string>;

    private _moveMade: Observable<string>;
    private _moveMadeSource: BehaviorSubject<string>;

    private _playerHand: Observable<CardModel>;
    private _playerHandSource: BehaviorSubject<CardModel>;

    private _newGameState: GameState;


    constructor() {
        this._authenticatedSource = new BehaviorSubject<boolean>(false);
        this._authenticated = this._authenticatedSource.asObservable();

        this._currentPlayerSource = new BehaviorSubject<string>("-1");
        this._currentPlayer = this._currentPlayerSource.asObservable();

        this._moveMadeSource = new BehaviorSubject<string>("-1");
        this._moveMade = this._moveMadeSource.asObservable();

        this._playerHandSource = new BehaviorSubject<CardModel>(null);
        this._playerHand = this._playerHandSource.asObservable();

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

    loadGame():void{

    }

    //set up the listener for player change in firebase
    init(): void {
        firebase.database().ref(this._gameId + "/players/" + this._playerId + "/hand")
            .on('child_added', snapshot => this._playerHandSource.next(snapshot.val() as CardModel));
        
        firebase.database().ref(this._gameId + "/gameState")
            .on('value', snapshot => this.prepareGameState(snapshot.val()));
    }

    prepareGameState(gameState:Object):void{
        
    }

    // this will return a proper game state class that the service can decipher
    getGameState(): Promise<GameState> {
        this._newGameState = new GameState();
        return this.getHand();
    }

    getHand(): Promise<GameState> {
        return firebase.database().ref(this._gameId + "/players/" + this._playerId)
            .once('value')
            .then(snapshot => this.getPublic(snapshot.val().hand as CardModel[]))
    }

    getPublic(hand: CardModel[]): Promise<GameState> {
        // convert to array -- do this here or in game service?        
        this._newGameState.hand = Object.keys(hand).map(key => hand[key]);
        return firebase.database().ref(this._gameId + "/public")
            .once('value')
            .then(snapshot => this.completeGameState(snapshot.val()))
    }

    completeGameState(data: any): GameState {
        this._newGameState.cardInPlay = data.cardInPlay;
        // convert to array -- do this here or in game service?        
        this._newGameState.players = Object.keys(data.players)
            .map(key => data.players[key]);
        console.log(this._newGameState);
        return this._newGameState;
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

    playCard(cardInPlay: CardModel, playerHand: Object): void {
        let update: Object = {};
        update[this._gameId + "/players/" + this._playerId + "/hand"] = playerHand;
        update[this._gameId + "/public/cardInPlay"] = cardInPlay;
        update[this._gameId + "/public/players/" + this._playerId + "/cardsInHand"] = Object.keys(playerHand).length;

        //// dev - make current player logic
        update[this._gameId + "/currentPlayer"] = this._currentPlayerSource.value == "JLNl39V9SZc1ri8FXe7bVCFbyBN2" ?
            "lcSyk6JsAMcuDrnOIrX06vKA5MD3" : "JLNl39V9SZc1ri8FXe7bVCFbyBN2";
        firebase.database().ref().update(update);
    }

    // redundant with above except for card in play
    pass(playerHand:Object):void{
        let update: Object = {};
        update[this._gameId + "/players/" + this._playerId + "/hand"] = playerHand;                

        //// dev - make current player logic
        update[this._gameId + "/currentPlayer"] = this._currentPlayerSource.value == "JLNl39V9SZc1ri8FXe7bVCFbyBN2" ?
            "lcSyk6JsAMcuDrnOIrX06vKA5MD3" : "JLNl39V9SZc1ri8FXe7bVCFbyBN2";
        firebase.database().ref().update(update);
    }

    //GET SET

    get authenticated(): Observable<boolean> {
        return this._authenticated;
    }

    get currentPlayer(): Observable<string> {
        return this._currentPlayer;
    }

    get moveMade():Observable<string>{
        return this._moveMade;
    }

    get playerHand():Observable<CardModel>{
        return this._playerHand;
    }

    get playerId(): string {
        return this._playerId;
    }
}