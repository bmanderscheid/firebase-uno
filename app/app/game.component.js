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
var core_1 = require('@angular/core');
var game_service_1 = require('../app/game.service');
var card_sprite_1 = require('../app/card.sprite');
var GameComponent = (function () {
    function GameComponent(_gameService) {
        this._gameService = _gameService;
        //move to config(s)
        this.PLAYER_REALM_Y = 640;
        this._firstGameStateUpdate = true;
    }
    GameComponent.prototype.ngOnInit = function () {
        this.preparePIXI();
        this.loadAssets();
    };
    GameComponent.prototype.preparePIXI = function () {
        this._renderer = PIXI.autoDetectRenderer(1024, 768, { backgroundColor: 0x1099bb });
        document.getElementById("stage").appendChild(this._renderer.view);
        this._stage = new PIXI.Container();
    };
    GameComponent.prototype.loadAssets = function () {
        var _this = this;
        this._loader = new PIXI.loaders.Loader('assets/');
        this._loader.add('cards.json');
        this._loader.load(function () { return _this.assetsLoaded(); });
    };
    GameComponent.prototype.assetsLoaded = function () {
        this.render();
        this.initGame();
    };
    GameComponent.prototype.initGame = function () {
        var _this = this;
        this._playerCards = [];
        this._gameService.init();
        this._gameService.gameState.subscribe(function (gameState) {
            if (!gameState)
                return;
            _this._currentGameState = gameState;
            _this.updateGame();
            _this.renderGame();
            _this._firstGameStateUpdate = false; // set to false so rendered property is honored      
        });
    };
    /*
      GAME UPDTATE
    */
    GameComponent.prototype.updateGame = function () {
        // update realms    
        this._playerHand = this._currentGameState.hand;
        this.updatePlayerCards();
        this._playerCards.sort(function (a, b) {
            if (a.cardModel.id < b.cardModel.id)
                return -1;
            if (a.cardModel.id > b.cardModel.id)
                return 1;
            return 0;
        });
    };
    GameComponent.prototype.updatePlayerCards = function () {
        for (var _i = 0, _a = this._playerHand; _i < _a.length; _i++) {
            var cardModel = _a[_i];
            if (this._firstGameStateUpdate) {
                this.spawnCard(cardModel);
            }
            else {
                if (!cardModel.rendered) {
                    this.spawnCard(cardModel);
                }
            }
        }
    };
    GameComponent.prototype.spawnCard = function (cardModel) {
        var card = new card_sprite_1.CardSprite(cardModel);
        card.render();
        card.anchor.set(.5, .5);
        card.position.set(100, 50);
        this._playerCards.push(card);
    };
    /*
      GAME RENDER
    */
    GameComponent.prototype.renderGame = function () {
        this.renderPlayerCards();
    };
    GameComponent.prototype.renderPlayerCards = function () {
        var _this = this;
        var stageCenter = 512;
        var widthOfHand = this._playerCards.length * this._playerCards[0].width;
        var xPos = stageCenter - (widthOfHand / 2) + (this._playerCards[0].width / 2);
        for (var _i = 0, _a = this._playerCards; _i < _a.length; _i++) {
            var sprite = _a[_i];
            this._stage.addChild(sprite);
            TweenLite.to(sprite, .5, {
                onUpdate: this.render,
                onUpdateScope: this,
                x: xPos,
                y: this.PLAYER_REALM_Y,
                rotation: 360 * (Math.PI / 180)
            });
            xPos += sprite.width;
        }
        //temp - move later
        TweenLite.delayedCall(.1, function () { return _this.evaluateGame(); });
    };
    /*
        GAME EVALUATIONS AND ACTIONS
    */
    GameComponent.prototype.evaluateGame = function () {
        if (this._gameService.isCurrentPlayer)
            this.enableMoves();
    };
    GameComponent.prototype.enableMoves = function () {
        var _this = this;
        this._stage.interactive = true;
        this._stage.on("mousedown", function (e) { return _this.drawCard(); });
    };
    GameComponent.prototype.drawCard = function () {
        this._gameService.drawCard();
    };
    GameComponent.prototype.render = function () {
        if (!this._renderer)
            return;
        this._renderer.render(this._stage);
    };
    GameComponent = __decorate([
        core_1.Component({
            selector: 'game',
            template: '<div id="stage"></div>'
        }), 
        __metadata('design:paramtypes', [game_service_1.GameService])
    ], GameComponent);
    return GameComponent;
}());
exports.GameComponent = GameComponent;
//# sourceMappingURL=game.component.js.map