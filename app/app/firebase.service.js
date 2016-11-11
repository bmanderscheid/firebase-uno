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
                _this._uid = user.uid;
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
    };
    // this will return a proper game state class that the service can decipher
    FirebaseService.prototype.getGameState = function () {
        this._newGameState = new game_state_model_1.GameState();
        return this.getHand();
    };
    FirebaseService.prototype.getHand = function () {
        var _this = this;
        return firebase.database().ref(this._gameId + "/players/" + this._uid)
            .once('value')
            .then(function (snapshot) { return _this.getPublic(snapshot.val().hand); });
    };
    FirebaseService.prototype.getPublic = function (hand) {
        var _this = this;
        this._newGameState.hand = hand;
        return firebase.database().ref(this._gameId + "/public")
            .once('value')
            .then(function (snapshot) { return _this.completeGameState(snapshot.val().players); });
    };
    FirebaseService.prototype.completeGameState = function (v) {
        this._newGameState.players = v;
        return this._newGameState;
    };
    Object.defineProperty(FirebaseService.prototype, "authenticated", {
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
    FirebaseService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [])
    ], FirebaseService);
    return FirebaseService;
}());
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=firebase.service.js.map