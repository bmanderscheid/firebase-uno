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
                console.log("auth changed, user in");
                if (!_this._playerId) {
                    _this._playerId = user.uid;
                    _this.init();
                }
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
    FirebaseService.prototype.getDeck = function () {
        return firebase.database().ref(this._gameId + "/deck")
            .once('value', function (snapshot) { return snapshot; });
    };
    FirebaseService.prototype.drawCard = function () {
        var _this = this;
        this.getDeck()
            .then(function (snapshot) { return _this.updatePlayerHandAfterDraw(snapshot.val()); });
    };
    FirebaseService.prototype.drawMultipleCards = function (numCards) {
        var _this = this;
        this.getDeck()
            .then(function (snapshot) { return _this.updatePlayersHandAfterMultipleDraw(snapshot.val(), numCards); });
    };
    FirebaseService.prototype.updatePlayerHandAfterDraw = function (deck) {
        var _this = this;
        var cards = Object.keys(deck).map(function (key) { return deck[key]; }); // turn deck into array
        cards = this.sortCards(cards); // order array by deck order
        var card = cards.pop();
        var updates = {};
        updates[this._gameId + "/deck/" + card.id] = null;
        updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = card;
        updates[this._gameId + "/gameState/lastMoveType"] = "draw";
        firebase.database().ref()
            .update(updates, function () { return _this.updatePlayerCardsInHand(); });
    };
    FirebaseService.prototype.updatePlayersHandAfterMultipleDraw = function (deck, numCards) {
        var _this = this;
        var cards = Object.keys(deck).map(function (key) { return deck[key]; }); // turn deck into array
        cards = this.sortCards(cards); // order array by deck order
        var updates = {};
        for (var i = 0; i < numCards; i++) {
            var card = cards.pop();
            updates[this._gameId + "/deck/" + card.id] = null;
            updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = card;
        }
        updates[this._gameId + "/gameState/lastMoveType"] = "play";
        firebase.database().ref()
            .update(updates, function () { return _this.updatePlayerCardsInHand(); });
    };
    /*
        PLAYS
    */
    FirebaseService.prototype.playCard = function (card, newHandCount) {
        var _this = this;
        var moveType = card.opponentDraw ? "draw" + card.opponentDraw : "play";
        var updates = {};
        updates[this._gameId + "/playerHands/" + this._playerId + "/" + card.id] = null;
        updates[this._gameId + "/gameState/cardInPlay"] = card;
        updates[this._gameId + "/gameState/players/" + this._playerId + "/cardsInHand"] = newHandCount;
        updates[this._gameId + "/gameState/currentPlayer"] = this._gameStateSource.value.currentPlayer == 0 ? 1 : 0;
        updates[this._gameId + "/gameState/lastMoveType"] = moveType;
        firebase.database().ref().update(updates, function () { return _this.updatePlayerCardsInHand(); });
    };
    FirebaseService.prototype.pass = function () {
        var update = {};
        update[this._gameId + "/gameState/currentPlayer"] = this._gameStateSource.value.currentPlayer == 0 ? 1 : 0;
        update[this._gameId + "/gameState/lastMoveType"] = "pass";
        firebase.database().ref().update(update);
    };
    FirebaseService.prototype.updatePlayerCardsInHand = function () {
        var _this = this;
        var ref = firebase.database().ref(this._gameId + "/playerHands/" + this._playerId);
        ref.once('value')
            .then(function (snapshot) {
            return firebase.database().ref(_this._gameId + "/gameState/players/" + _this._playerId)
                .update({ cardsInHand: Object.keys(snapshot.val()).length });
        });
    };
    // UTILITY
    FirebaseService.prototype.sortCards = function (cards) {
        return cards.sort(function (a, b) {
            if (a.deckOrder < b.deckOrder)
                return -1;
            if (a.deckOrder > b.deckOrder)
                return 1;
            return 0;
        });
    };
    Object.defineProperty(FirebaseService.prototype, "playerHand", {
        //GET SET
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