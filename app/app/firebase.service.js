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
//requires
var firebase = require('firebase/app');
require('firebase/database');
require('firebase/auth');
var FirebaseService = (function () {
    function FirebaseService() {
        //will be passed in somehow from dashboard
        this._gameId = "game_1234";
        this._playerHandSource = new BehaviorSubject_1.BehaviorSubject(null);
        this._playerHand = this._playerHandSource.asObservable();
        this._gameStateSource = new BehaviorSubject_1.BehaviorSubject(null);
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
    FirebaseService.prototype.auth = function () {
        var _this = this;
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                _this._playerId = user.uid;
                _this.init();
            }
            else {
                var provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithRedirect(provider);
            }
        });
    };
    FirebaseService.prototype.getGame = function () {
        return firebase.database().ref(this._gameId + "/gameData")
            .once('value', function (snapshot) { return snapshot.val(); });
    };
    FirebaseService.prototype.init = function () {
        var _this = this;
        firebase.database().ref(this._gameId + "/gameState")
            .on('value', function (snapshot) {
            _this._gameStateSource.next(snapshot.val());
        });
        firebase.database().ref(this._gameId + "/playerHands/" + this._playerId)
            .on('child_added', function (snapshot) {
            _this._playerHandSource.next(snapshot.val());
        });
    };
    /*
        DRAW CARD
    */
    FirebaseService.prototype.drawCard = function () {
        var _this = this;
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
        var updates = {};
        updates[this._gameId + "/deck/" + card.id] = null;
        updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = card;
        //// get actual number in hand
        // updates[this._gameId + "/public/players/" + this._playerId + "/cardsInHand"] = 5;
        firebase.database().ref()
            .update(updates, function () { return _this.updatePlayerCardsInHand(); });
    };
    FirebaseService.prototype.updatePlayerCardsInHand = function () {
        var ref = firebase.database().ref(this._gameId + "/gameState/players/" + this._playerId);
        ref.once('value')
            .then(function (snapshot) { return ref.update({ cardsInHand: snapshot.val().cardsInHand + 1 }); });
    };
    /*
        PLAYS
    */
    FirebaseService.prototype.playCard = function (card, newHandCount) {
        var update = {};
        update[this._gameId + "/players/" + this._playerId + "/hand/" + card.id] = null;
        update[this._gameId + "/gameState/cardInPlay"] = card;
        update[this._gameId + "/gameState/players/" + this._playerId + "/cardsInHand"] = newHandCount;
        update[this._gameId + "/gameState/currentPlayer"] = this._gameStateSource.value.currentPlayer == 0 ? 1 : 0;
        firebase.database().ref().update(update);
    };
    // redundant with above except for card in play
    FirebaseService.prototype.pass = function (playerHand) {
        var update = {};
        update[this._gameId + "/players/" + this._playerId + "/hand"] = playerHand;
        //// dev - make current player logic
        // change plager
        firebase.database().ref().update(update);
    };
    Object.defineProperty(FirebaseService.prototype, "playerHand", {
        //GET SET
        // get currentPlayer(): Observable<string> {
        //     return this._currentPlayer;
        // }
        get: function () {
            return this._playerHand;
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
    Object.defineProperty(FirebaseService.prototype, "gameState", {
        get: function () {
            return this._gameState;
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