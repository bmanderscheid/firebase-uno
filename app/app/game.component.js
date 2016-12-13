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
var game_values_1 = require('../app/game-values');
var GameComponent = (function () {
    function GameComponent(_gameService) {
        this._gameService = _gameService;
        //move to config(s)  
        this.GAME_SPEED = .5;
        this.PLAYER_REALM_Y = 640;
        this.OPPONENT_REALM_Y = 140;
        this.DISCARD_POS = { x: 600, y: 384 };
        this.DECK_POS = { x: 450, y: 384 };
        this._showColorPicker = false;
        this._numDrawsThisTurn = 0;
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
        this.drawUI();
        this.initGameService();
        // initialize sprite containers
        this._playerCards = [];
        this._opponentCards = [];
    };
    // draw initial UI
    GameComponent.prototype.drawUI = function () {
        var _this = this;
        this._deck = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
        this._deck.position.set(this.DECK_POS.x, this.DECK_POS.y);
        this._deck.anchor.set(.5, .5);
        this._deck.interactive = true;
        this._deck.on("mousedown", function (e) { return _this.drawCard(); });
        this._stage.addChild(this._deck);
    };
    GameComponent.prototype.initGameService = function () {
        var _this = this;
        this._gameService.init();
        this._gameService.gameState.subscribe(function (gameState) {
            if (gameState)
                _this.gameStateChanged(gameState);
        });
    };
    GameComponent.prototype.gameStateChanged = function (gameState) {
        switch (gameState.moveType) {
            case game_values_1.MoveType.CARD_ADDED_TO_HAND:
                this.updatePlayerHand(gameState.cardAddedToHand);
                break;
            case game_values_1.MoveType.OPPONENT_HAND_UPDATED:
                this.updateOpponentHand(gameState.opponentHandCount);
                break;
            case game_values_1.MoveType.CARD_IN_PLAY_UPDATED:
                this.cardInPlayChanged(gameState.cardInPlay);
                break;
        }
    };
    //GAME CHAGES
    GameComponent.prototype.cardInPlayChanged = function (cardModl) {
        this.updateCardInPlay(cardModl);
        this.renderCardInPlay();
    };
    GameComponent.prototype.updatePlayerHand = function (cardModel) {
        this.updatePlayerCards(cardModel);
        this.renderPlayerCards();
    };
    GameComponent.prototype.updateOpponentHand = function (opponentHandCount) {
        this.updateOpponentCards(opponentHandCount);
        this.renderOpponentCards();
    };
    //GAME UPDATES
    GameComponent.prototype.updateCardInPlay = function (cardModel) {
        this._cardInPlay = this.spawnCard(cardModel);
        this._cardInPlay.position.set(this.DISCARD_POS.x, this.DISCARD_POS.y);
    };
    GameComponent.prototype.updatePlayerCards = function (cardModel) {
        var _this = this;
        var card = this.spawnCard(cardModel);
        card.on("mousedown", function (e) { return _this.cardSelected(e.target); });
        this._playerCards.push(card);
        // sort cards
        this._playerCards = this.sortCards(this._playerCards);
    };
    // this is a two player game - but using a possible multiple oppoent approach
    GameComponent.prototype.updateOpponentCards = function (numCards) {
        var cardsDifference = numCards - this._opponentCards.length;
        if (this._opponentCards.length < 1)
            this.updateAllOpponentCardsOnStart(numCards);
        else if (cardsDifference < 0)
            this.opponentPlayedCard();
        else if (cardsDifference > 0)
            this.opponentDrewCard(cardsDifference);
    };
    GameComponent.prototype.updateAllOpponentCardsOnStart = function (numCards) {
        for (var i = 0; i < numCards; i++) {
            var card = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
            card.anchor.set(.5, .5);
            card.position.set(100, 50);
            this._opponentCards.push(card);
        }
    };
    //GAME RENDERS
    GameComponent.prototype.renderCardInPlay = function () {
        this._stage.addChild(this._cardInPlay);
        TweenLite.to(this._cardInPlay, this.GAME_SPEED, { x: this.DISCARD_POS.x, y: this.DISCARD_POS.y });
    };
    GameComponent.prototype.renderPlayerCards = function () {
        var stageCenter = 512;
        var widthOfHand = this._playerCards.length * this._playerCards[0].width;
        var xPos = stageCenter - (widthOfHand / 2) + (this._playerCards[0].width / 2);
        var delay = 0;
        for (var _i = 0, _a = this._playerCards; _i < _a.length; _i++) {
            var sprite = _a[_i];
            this._stage.addChild(sprite);
            TweenLite.to(sprite, this.GAME_SPEED, {
                onUpdate: this.render,
                onUpdateScope: this,
                x: xPos,
                y: this.PLAYER_REALM_Y,
                delay: delay,
                rotation: 360 * (Math.PI / 180)
            });
            delay += .1;
            xPos += sprite.width;
        }
        TweenLite.killTweensOf(this.evaluatePlayerHand);
        TweenLite.delayedCall(delay + this.GAME_SPEED, this.evaluatePlayerHand, null, this);
    };
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
    GameComponent.prototype.renderGame = function () {
        // possibly evaluate this on gamestate update
        if (this._playerCards.length > 0)
            this.renderPlayerCards();
        if (this._opponentCards.length > 0)
            this.renderOpponentCards();
        this.renderCardInPlay();
    };
    // GAME PLAY
    GameComponent.prototype.cardSelected = function (card) {
        if (!this._gameService.isCurrentPlayer || !this.isCardPlayable(card))
            return;
        if (card.cardModel.isWild) {
            this._currentWildCard = card;
            this._showColorPicker = true;
        }
        else {
            this.playCard(card);
        }
    };
    GameComponent.prototype.playCard = function (card) {
        this.bringSpriteToFront(card);
        TweenLite.to(card, this.GAME_SPEED, {
            x: this.DISCARD_POS.x, y: this.DISCARD_POS.y,
            onUpdate: this.render,
            onUpdateScope: this,
            onComplete: this.cardPlayed,
            onCompleteScope: this,
            onCompleteParams: [card]
        });
    };
    GameComponent.prototype.isCardPlayable = function (card) {
        if (card.cardModel.value == this._cardInPlay.cardModel.value
            || card.cardModel.color == this._cardInPlay.cardModel.color || card.cardModel.isWild)
            return true;
        return false;
    };
    GameComponent.prototype.cardPlayed = function (card) {
        this.removeCardSpriteFromPlayerCards(card);
        this._gameService.playCard(card.cardModel);
        this.resetPlayerForNextTurn();
    };
    //TODO -using current tween list to determine if a move can be made.  Use more or not at all
    GameComponent.prototype.drawCard = function () {
        if (this._numDrawsThisTurn > 0 || !this._gameService.isCurrentPlayer)
            return;
        if (!this.playPossible() && TweenMax.getAllTweens().length == 0) {
            this._numDrawsThisTurn++;
            this._gameService.drawCard();
        }
    };
    GameComponent.prototype.playPossible = function () {
        var cardInPlayModel = this._cardInPlay.cardModel;
        var playableCards = this._playerCards.filter(function (card) {
            return card.cardModel.isWild ||
                card.cardModel.value == cardInPlayModel.value ||
                card.cardModel.color == cardInPlayModel.color;
        });
        return playableCards.length > 0;
    };
    GameComponent.prototype.opponentPlayedCard = function () {
        var r = Math.floor(Math.random() * this._opponentCards.length);
        var card = this._opponentCards[r];
        this._cardInPlay.position.set(card.x, card.y);
        this._stage.removeChild(card);
        this._opponentCards.splice(r, 1);
        this.renderCardInPlay();
    };
    GameComponent.prototype.opponentDrewCard = function (numCards) {
        for (var i = 0; i < numCards; i++) {
            var card = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
            card.anchor.set(.5, .5);
            card.position.set(this.DECK_POS.x, this.DECK_POS.y);
            this._opponentCards.push(card);
        }
    };
    GameComponent.prototype.spawnCard = function (cardModel) {
        var card = new card_sprite_1.CardSprite(cardModel);
        card.render();
        card.interactive = true;
        card.anchor.set(.5, .5);
        card.position.set(this.DECK_POS.x, this.DECK_POS.y);
        return card;
    };
    GameComponent.prototype.colorPickerClicked = function (color) {
        this._currentWildCard.updateForWild(color);
        this._showColorPicker = false;
        this.playCard(this._currentWildCard);
        this._currentWildCard = null;
    };
    /*
      GAME EVALUATIONS
    */
    GameComponent.prototype.evaluatePlayerHand = function () {
        console.log("draws", this._numDrawsThisTurn);
        if (this._gameService.isCurrentPlayer
            && !this.playPossible()
            && this._numDrawsThisTurn > 0)
            this.pass();
    };
    GameComponent.prototype.resetPlayerForNextTurn = function () {
        this.renderPlayerCards();
        this._numDrawsThisTurn = 0;
    };
    GameComponent.prototype.pass = function () {
        this._gameService.pass();
        this.resetPlayerForNextTurn();
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
    GameComponent.prototype.removeCardSpriteFromPlayerCards = function (card) {
        this._playerCards = this._playerCards.filter(function (c) { return card.cardModel.id != c.cardModel.id; });
    };
    //update canvas
    GameComponent.prototype.render = function () {
        if (!this._renderer)
            return;
        this._renderer.render(this._stage);
    };
    GameComponent = __decorate([
        core_1.Component({
            selector: 'game',
            templateUrl: './app/game.component.html'
        }), 
        __metadata('design:paramtypes', [game_service_1.GameService])
    ], GameComponent);
    return GameComponent;
}());
exports.GameComponent = GameComponent;
//# sourceMappingURL=game.component.js.map