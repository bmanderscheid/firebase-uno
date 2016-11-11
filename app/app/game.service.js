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
require('rxjs/add/operator/toPromise');
var GameService = (function () {
    function GameService(_firebaseService) {
        this._firebaseService = _firebaseService;
    }
    GameService.prototype.init = function () {
        var _this = this;
        this._firebaseService.auth();
        this._firebaseService.authenticated.subscribe(function (auth) {
            if (auth) {
                _this.initGameService();
            }
        });
    };
    GameService.prototype.initGameService = function () {
        var _this = this;
        this._firebaseService.init();
        this._firebaseService.currentPlayer.subscribe(function (uid) {
            if (Number(uid) < 0)
                return; // ignore first subscribe update        
            _this.getGameState();
        });
    };
    GameService.prototype.getGameState = function () {
        this._firebaseService.getGameState().then(function (response) {
            console.log(response);
        });
    };
    GameService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [firebase_service_1.FirebaseService])
    ], GameService);
    return GameService;
}());
exports.GameService = GameService;
//# sourceMappingURL=game.service.js.map