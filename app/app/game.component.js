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
        this.GAME_SPEED = .5;
        this.PLAYER_REALM_Y = 640;
        this.OPPONENT_REALM_Y = 140;
        this.DISCARD_POS = { x: 600, y: 384 };
        this.DECK_POS = { x: 450, y: 384 };
        this._firstGameStateUpdate = true;
        this._canDraw = true;
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
        this.drawUI();
        this._playerCards = [];
        this._opponentCards = [];
        this._gameService.init();
        this._gameService.gameState.subscribe(function (gameState) {
            _this._playerHand = gameState.hand;
            _this.updateGame(gameState);
            _this.renderGame();
        });
    };
    GameComponent.prototype.drawUI = function () {
        var _this = this;
        this._deck = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
        this._deck.position.set(this.DECK_POS.x, this.DECK_POS.y);
        this._deck.anchor.set(.5, .5);
        this._deck.interactive = true;
        this._deck.on("mousedown", function (e) { return _this.drawCard(); });
        this._stage.addChild(this._deck);
    };
    /*
      GAME UPDTATE
    */
    GameComponent.prototype.updateGame = function (gameState) {
        if (gameState.cardInPlay)
            this.updateCardInPlay(gameState.cardInPlay);
        if (gameState.hand)
            this.updatePlayerCards(gameState.hand);
        if (gameState.players)
            this.updateOpponentCards(gameState.players[this._gameService.opponent]);
    };
    GameComponent.prototype.updateCardInPlay = function (cardModel) {
        this._cardInPlay = this.spawnCard(cardModel);
        this._cardInPlay.position.set(this.DISCARD_POS.x, this.DISCARD_POS.y);
    };
    GameComponent.prototype.updatePlayerCards = function (playerHand) {
        var _this = this;
        for (var _i = 0, playerHand_1 = playerHand; _i < playerHand_1.length; _i++) {
            var cardModel = playerHand_1[_i];
            // spawn card
            if (cardModel && !cardModel.spawned) {
                var card = this.spawnCard(cardModel);
                card.on("mousedown", function (e) { return _this.playCard(e.target); });
                this._playerCards.push(card);
            }
        }
        this._playerCards = this.sortCards(this._playerCards);
    };
    GameComponent.prototype.updateOpponentCards = function (opponent) {
        var cardsDifference = opponent.cardsInHand - this._opponentCards.length;
        console.log(cardsDifference);
        if (this._opponentCards.length < 1)
            this.updateAllOpponentCardsOnStart(opponent.cardsInHand);
        else if (cardsDifference < 0)
            this.opponentPlayedCard();
        else if (cardsDifference > 0)
            this.opponentDrewCard();
        // else
        //   if (cardsDifference < 0) this.opponentCardPlay();
        //   else if (cardsDifference > 0) this.opponentDrawCard();
    };
    GameComponent.prototype.updateAllOpponentCardsOnStart = function (numCards) {
        for (var i = 0; i < numCards; i++) {
            var card = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
            card.anchor.set(.5, .5);
            card.position.set(100, 50);
            this._opponentCards.push(card);
        }
    };
    GameComponent.prototype.opponentPlayedCard = function () {
        console.log("opp drew card");
        var r = Math.floor(Math.random() * this._opponentCards.length);
        var card = this._opponentCards[r];
        this._cardInPlay.position.set(card.x, card.y);
        this._stage.removeChild(card);
        this._opponentCards.splice(r, 1);
    };
    GameComponent.prototype.opponentDrewCard = function () {
        var card = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
        card.anchor.set(.5, .5);
        card.position.set(this.DECK_POS.x, this.DECK_POS.y);
        this._opponentCards.push(card);
    };
    GameComponent.prototype.spawnCard = function (cardModel) {
        var card = new card_sprite_1.CardSprite(cardModel);
        card.render();
        card.interactive = true;
        card.anchor.set(.5, .5);
        card.position.set(this.DECK_POS.x, this.DECK_POS.y);
        return card;
    };
    /*
      GAME RENDER
    */
    GameComponent.prototype.renderGame = function () {
        // possibly evaluate this on gamestate update
        if (this._playerHand.length > 0)
            this.renderPlayerCards();
        if (this._opponentCards.length > 0)
            this.renderOpponentCards();
        this.renderCardInPlay();
    };
    GameComponent.prototype.renderCardInPlay = function () {
        if (!this._cardInPlay)
            return;
        this._stage.addChild(this._cardInPlay);
        TweenLite.to(this._cardInPlay, this.GAME_SPEED, { x: this.DISCARD_POS.x, y: this.DISCARD_POS.y });
    };
    GameComponent.prototype.renderPlayerCards = function () {
        var stageCenter = 512;
        var widthOfHand = this._playerCards.length * this._playerCards[0].width;
        var xPos = stageCenter - (widthOfHand / 2) + (this._playerCards[0].width / 2);
        for (var _i = 0, _a = this._playerCards; _i < _a.length; _i++) {
            var sprite = _a[_i];
            this._stage.addChild(sprite);
            TweenLite.to(sprite, this.GAME_SPEED, {
                onUpdate: this.render,
                onUpdateScope: this,
                x: xPos,
                y: this.PLAYER_REALM_Y,
                rotation: 360 * (Math.PI / 180)
            });
            xPos += sprite.width;
        }
    };
    // combine function with render player cards
    GameComponent.prototype.renderOpponentCards = function () {
        var stageCenter = 512;
        var widthOfHand = this._opponentCards.length * this._opponentCards[0].width;
        var xPos = stageCenter - (widthOfHand / 2) + (this._opponentCards[0].width / 2);
        for (var _i = 0, _a = this._opponentCards; _i < _a.length; _i++) {
            var sprite = _a[_i];
            this._stage.addChild(sprite);
            TweenLite.to(sprite, this.GAME_SPEED, {
                onUpdate: this.render,
                onUpdateScope: this,
                x: xPos,
                y: this.OPPONENT_REALM_Y,
                rotation: 360 * (Math.PI / 180)
            });
            xPos += sprite.width;
        }
    };
    /*
        GAME EVALUATIONS AND ACTIONS
    */
    GameComponent.prototype.playCard = function (card) {
        if (!this._gameService.isCurrentPlayer)
            return;
        this.bringSpriteToFront(card);
        TweenLite.to(card, this.GAME_SPEED, {
            x: this.DISCARD_POS.x, y: this.DISCARD_POS.y,
            onUpdate: this.render,
            onUpdateScope: this,
            onComplete: this.evaluatePlayedCard,
            onCompleteScope: this,
            onCompleteParams: [card]
        });
    };
    GameComponent.prototype.evaluatePlayedCard = function (card) {
        if (card.cardModel.value == this._cardInPlay.cardModel.value
            || card.cardModel.color == this._cardInPlay.cardModel.color) {
            this.pullCardSpriteFromPlayerCards(card);
            this._gameService.playCard(card.cardModel);
        }
        else {
            this.renderPlayerCards();
        }
    };
    GameComponent.prototype.drawCard = function () {
        if (this._canDraw) {
            this._canDraw = false;
            this._gameService.drawCard();
        }
    };
    GameComponent.prototype.resetPlayerForNextTurn = function () {
        this._canDraw = true;
    };
    GameComponent.prototype.isPlayPossible = function () {
        for (var _i = 0, _a = this._playerHand; _i < _a.length; _i++) {
            var card = _a[_i];
            if (card.value == this._cardModelInPlay.value
                || card.color == this._cardModelInPlay.color)
                return false;
        }
        return true;
    };
    GameComponent.prototype.pass = function () {
        this._gameService.pass();
    };
    /*
      UTILITY
    */
    GameComponent.prototype.sortCards = function (cards) {
        return cards.sort(function (a, b) {
            if (a.cardModel.id < b.cardModel.id)
                return -1;
            if (a.cardModel.id > b.cardModel.id)
                return 1;
            return 0;
        });
    };
    GameComponent.prototype.bringSpriteToFront = function (sprite) {
        this._stage.removeChild(sprite);
        this._stage.addChild(sprite);
    };
    GameComponent.prototype.pullCardSpriteFromPlayerCards = function (card) {
        this._playerCards = this._playerCards.filter(function (c) { return card.cardModel.id != c.cardModel.id; });
    };
    GameComponent.prototype.render = function () {
        if (!this._renderer)
            return;
        this._renderer.render(this._stage);
    };
    GameComponent = __decorate([
        core_1.Component({
            selector: 'game',
            template: '<div style="position:absolute">CURRENT PLAYER: {{_gameService.currentPlayer}}</div><div id="stage"></div>'
        }), 
        __metadata('design:paramtypes', [game_service_1.GameService])
    ], GameComponent);
    return GameComponent;
}());
exports.GameComponent = GameComponent;
//# sourceMappingURL=game.component.js.map