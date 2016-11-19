"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
//imports
var core_1 = require('@angular/core');
require('rxjs/add/operator/toPromise');
var BehaviorSubject_1 = require('rxjs/BehaviorSubject');
var game_state_model_1 = require('../app/game-state.model');
//requires
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');
var FirebaseService = (function () {
    function FirebaseService() {
        //will be passed in somehow from dashboard
        this._gameId = "game_1234";
        this._authenticatedSource = new BehaviorSubject_1.BehaviorSubject(false);
        this._authenticated = this._authenticatedSource.asObservable();
        this._currentPlayerSource = new BehaviorSubject_1.BehaviorSubject("-1");
        this._currentPlayer = this._currentPlayerSource.asObservable();
        this._moveMadeSource = new BehaviorSubject_1.BehaviorSubject("-1");
        this._moveMade = this._moveMadeSource.asObservable();
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
    FirebaseService.prototype.auth = function () {
        var _this = this;
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                _this._playerId = user.uid;
                _this._authenticatedSource.next(true);
            }
            else {
                var provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithRedirect(provider);
            }
        });
    };
    //set up the listener for player change in firebase
    FirebaseService.prototype.init = function () {
        var _this = this;
        firebase.database().ref(this._gameId + "/currentPlayer")
            .on('value', function (snapshot) { return _this._currentPlayerSource.next(snapshot.val()); });
        firebase.database().ref(this._gameId + "/public/move")
            .on('value', function (snapshot) { return _this._moveMadeSource.next(snapshot.val()); });
    };
    // this will return a proper game state class that the service can decipher
    FirebaseService.prototype.getGameState = function () {
        this._newGameState = new game_state_model_1.GameState();
        return this.getHand();
    };
    FirebaseService.prototype.getHand = function () {
        var _this = this;
        return firebase.database().ref(this._gameId + "/players/" + this._playerId)
            .once('value')
            .then(function (snapshot) { return _this.getPublic(snapshot.val().hand); });
    };
    FirebaseService.prototype.getPublic = function (hand) {
        var _this = this;
        // convert to array -- do this here or in game service?        
        this._newGameState.hand = Object.keys(hand).map(function (key) { return hand[key]; });
        return firebase.database().ref(this._gameId + "/public")
            .once('value')
            .then(function (snapshot) { return _this.completeGameState(snapshot.val()); });
    };
    FirebaseService.prototype.completeGameState = function (data) {
        this._newGameState.cardInPlay = data.cardInPlay;
        // convert to array -- do this here or in game service?        
        this._newGameState.players = Object.keys(data.players)
            .map(function (key) { return data.players[key]; });
        console.log(this._newGameState);
        return this._newGameState;
    };
    /*
        DRAW CARD
    */
    FirebaseService.prototype.drawCardForCurrentUser = function () {
        var _this = this;
        console.log("drawing card....");
        firebase.database().ref(this._gameId + "/deck")
            .once('value')
            .then(function (snapshot) { return _this.updatePlayerHand(snapshot.val()); });
    };
    FirebaseService.prototype.updatePlayerHand = function (deck) {
        var _this = this;
        var cards = Object.keys(deck).map(function (key) { return deck[key]; });
        cards.sort(function (a, b) {
            if (a.deckOrder < b.deckOrder)
                return -1;
            if (a.deckOrder > b.deckOrder)
                return 1;
            return 0;
        });
        var card = cards.pop();
        card.rendered = false;
        var updates = {};
        updates[this._gameId + "/deck/" + card.id] = null;
        updates[this._gameId + "/players/" + this._playerId + "/hand/" + card.id] = card;
        updates[this._gameId + "/public/move"] = new Date().toLocaleString();
        //// get actual number in hand
        updates[this._gameId + "/public/players/" + this._playerId + "/cardsInHand"] = 5;
        firebase.database().ref()
            .update(updates, function (snapshot) { return _this._currentPlayerSource.next(_this._playerId); });
    };
    /*
        PLAYS
    */
    FirebaseService.prototype.playCard = function (cardInPlay, playerHand) {
        var update = {};
        update[this._gameId + "/players/" + this._playerId + "/hand"] = playerHand;
        update[this._gameId + "/public/cardInPlay"] = cardInPlay;
        update[this._gameId + "/public/players/" + this._playerId + "/cardsInHand"] = Object.keys(playerHand).length;
        //// dev - make current player logic
        update[this._gameId + "/currentPlayer"] = this._currentPlayerSource.value == "JLNl39V9SZc1ri8FXe7bVCFbyBN2" ?
            "lcSyk6JsAMcuDrnOIrX06vKA5MD3" : "JLNl39V9SZc1ri8FXe7bVCFbyBN2";
        firebase.database().ref().update(update);
    };
    // redundant with above except for card in play
    FirebaseService.prototype.pass = function (playerHand) {
        var update = {};
        update[this._gameId + "/players/" + this._playerId + "/hand"] = playerHand;
        //// dev - make current player logic
        update[this._gameId + "/currentPlayer"] = this._currentPlayerSource.value == "JLNl39V9SZc1ri8FXe7bVCFbyBN2" ?
            "lcSyk6JsAMcuDrnOIrX06vKA5MD3" : "JLNl39V9SZc1ri8FXe7bVCFbyBN2";
        firebase.database().ref().update(update);
    };
    Object.defineProperty(FirebaseService.prototype, "authenticated", {
        //GET SET
        get: function () {
            return this._authenticated;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FirebaseService.prototype, "currentPlayer", {
        get: function () {
            return this._currentPlayer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FirebaseService.prototype, "moveMade", {
        get: function () {
            return this._moveMade;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FirebaseService.prototype, "playerId", {
        get: function () {
            return this._playerId;
        },
        enumerable: true,
        configurable: true
    });
    FirebaseService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [])
    ], FirebaseService);
    return FirebaseService;
}());
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=firebase.service.js.map