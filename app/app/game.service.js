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
var firebase_service_1 = require('../app/firebase.service');
var game_state_model_1 = require('../app/game-state.model');
require('rxjs/add/operator/toPromise');
var BehaviorSubject_1 = require('rxjs/BehaviorSubject');
var GameService = (function () {
    function GameService(_firebaseService) {
        this._firebaseService = _firebaseService;
        this._currentGameState = new game_state_model_1.GameState();
        this._currentGameState.hand = [];
        this._gameStateSource = new BehaviorSubject_1.BehaviorSubject(this._currentGameState);
        this._gameState = this._gameStateSource.asObservable();
        this._playerHand = [];
    }
    GameService.prototype.init = function () {
        var _this = this;
        this._firebaseService.init();
        this._firebaseService.playerHand.subscribe(function (card) {
            if (card)
                _this._currentGameState.hand.push(card);
            _this.sendNextGameState();
        });
    };
    GameService.prototype.sendNextGameState = function () {
        this._gameStateSource.next(this._currentGameState);
    };
    GameService.prototype.initGameService = function () {
    };
    GameService.prototype.loadGame = function () {
        // this._firebaseService.getGameState().then((response: GameState) =>
        //     this._gameStateSource.next(response));
    };
    /*
        GAME ACTIONS
    */
    GameService.prototype.playCard = function (cardInPlay) {
        var gameState = this._gameStateSource.value;
        var playerHand = this.removeCardFromHand(cardInPlay, gameState.hand);
        var newPlayerHand = playerHand.reduce(function (o, v, i) {
            o[v.id] = v;
            return o;
        }, {});
        this._firebaseService.playCard(cardInPlay, newPlayerHand);
    };
    GameService.prototype.drawCard = function () {
        this._firebaseService.drawCardForCurrentUser();
    };
    // player passes - but update hand so render values get update
    GameService.prototype.pass = function () {
        var gameState = this._gameStateSource.value;
        var playerHand = this._gameStateSource.value.hand;
        var newPlayerHand = playerHand.reduce(function (o, v, i) {
            o[v.id] = v;
            return o;
        }, {});
        this._firebaseService.pass(newPlayerHand);
    };
    /*
        UTILITY
    */
    GameService.prototype.removeCardFromHand = function (card, hand) {
        return hand.filter(function (c) { return c.id != card.id; });
    };
    Object.defineProperty(GameService.prototype, "gameState", {
        //GET SET
        get: function () {
            return this._gameState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameService.prototype, "isCurrentPlayer", {
        get: function () {
            return this._currentPlayer == this._firebaseService.playerId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameService.prototype, "currentPlayer", {
        get: function () {
            return this._currentPlayer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameService.prototype, "playerId", {
        get: function () {
            return this._firebaseService.playerId;
        },
        enumerable: true,
        configurable: true
    });
    GameService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [firebase_service_1.FirebaseService])
    ], GameService);
    return GameService;
}());
exports.GameService = GameService;
//# sourceMappingURL=game.service.js.map