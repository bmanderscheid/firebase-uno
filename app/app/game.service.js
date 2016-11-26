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
    }
    GameService.prototype.init = function () {
        var _this = this;
        // just getting getting by before dashboard
        this._firebaseService.auth();
        this._firebaseService.getGame()
            .then(function (gameData) {
            _this._game = gameData.val();
            _this.startGame();
        });
    };
    GameService.prototype.startGame = function () {
        var _this = this;
        this._firebaseService.playerHand.subscribe(function (card) {
            if (card)
                _this._currentGameState.hand.push(card);
            _this.sendNextGameState();
        });
        this._firebaseService.gameState.subscribe(function (gameState) {
            if (gameState) {
                _this._currentPlayerIndex = gameState.currentPlayer;
                _this._currentGameState.cardInPlay = gameState.cardInPlay;
                _this._currentGameState.players = gameState.players;
                _this._currentGameState.lastMoveType = gameState.lastMoveType;
            }
            _this.sendNextGameState();
        });
    };
    GameService.prototype.sendNextGameState = function () {
        this._gameStateSource.next(this._currentGameState);
    };
    /*
        GAME ACTIONS
    */
    GameService.prototype.playCard = function (card) {
        this._firebaseService.playCard(card, this._gameStateSource.value.hand.length);
    };
    GameService.prototype.drawCard = function () {
        this._firebaseService.drawCard();
    };
    GameService.prototype.drawMultipleCards = function (numCards) {
        this._firebaseService.drawMultipleCards(numCards);
    };
    GameService.prototype.pass = function () {
        this._firebaseService.pass();
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
            return this._game.players[this._currentPlayerIndex].uid == this._firebaseService.playerId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameService.prototype, "opponent", {
        get: function () {
            var _this = this;
            return this._game.players.filter(function (player) { return player.uid != _this._firebaseService.playerId; })[0].uid;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameService.prototype, "currentPlayer", {
        get: function () {
            return this._currentPlayerIndex;
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