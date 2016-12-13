import { Component, OnInit } from '@angular/core';
import { GameService } from '../app/game.service';
import { GameState } from '../app/game-state.model'
import { CardSprite } from '../app/card.sprite';
import { CardModel } from '../app/card.model';
import { PlayerModel } from '../app/player.model';
import { MoveType } from '../app/game-values';

@Component({
    selector: 'game',
    templateUrl: './app/game.component.html'
})
export class GameComponent implements OnInit {

    //pixi
    private _stage: PIXI.Container;
    private _renderer: PIXI.SystemRenderer;
    private _loader: PIXI.loaders.Loader;

    //move to config(s)  
    private GAME_SPEED: number = .5
    private PLAYER_REALM_Y: number = 640;
    private OPPONENT_REALM_Y: number = 140;
    private DISCARD_POS: any = { x: 600, y: 384 };
    private DECK_POS: any = { x: 450, y: 384 };  
    private CARD_SIZE:any ={ width:98, height:130 };  

    //sprites
    private _playerCards: CardSprite[];
    private _opponentCards: PIXI.Sprite[];
    private _deck: PIXI.Sprite;
    private _cardInPlay: CardSprite;
    private _currentWildCard: CardSprite;
    
    //game play
    private _numDrawsThisTurn: number;
    private _showColorPicker: boolean;

    constructor(private _gameService: GameService) {
        this._showColorPicker = false;
        this._numDrawsThisTurn = 0;
    }

    ngOnInit() {
        this.preparePIXI();
        this.loadAssets();
    }

    private preparePIXI(): void {
        this._renderer = PIXI.autoDetectRenderer(1024, 768, { backgroundColor: 0x1099bb });
        document.getElementById("stage").appendChild(this._renderer.view);
        this._stage = new PIXI.Container();
    }

    private loadAssets(): void {
        this._loader = new PIXI.loaders.Loader('assets/');
        this._loader.add('cards.json');
        this._loader.load(() => this.assetsLoaded())
    }

    private assetsLoaded(): void {
        this.render();
        this.initGame();
    }

    private initGame(): void {    
        this.drawUI();
        this.initGameService();

        // initialize sprite containers
        this._playerCards = [];
        this._opponentCards = [];
    }

    // draw initial UI
    private drawUI(): void {
        this._deck = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
        this._deck.position.set(this.DECK_POS.x, this.DECK_POS.y);
        this._deck.anchor.set(.5, .5);
        this._deck.interactive = true;
        this._deck.on("mousedown", (e) => this.drawCard());
        this._stage.addChild(this._deck);
    }

    private initGameService(): void {        
        this._gameService.init();
        this._gameService.gameState.subscribe((gameState: GameState) => {
            if (gameState) this.gameStateChanged(gameState);
        });
    }

    private gameStateChanged(gameState: GameState): void {
        switch (gameState.moveType) {
            case MoveType.CARD_ADDED_TO_HAND:
                this.updatePlayerHand(gameState.cardAddedToHand);
                break;
            case MoveType.OPPONENT_HAND_UPDATED:
                this.updateOpponentHand(gameState.opponentHandCount);
                break;
            case MoveType.CARD_IN_PLAY_UPDATED: // card played
                this.cardInPlayChanged(gameState.cardInPlay);
                break;
        }
    }

    //GAME CHAGES

    private cardInPlayChanged(cardModl: CardModel): void {
        this.updateCardInPlay(cardModl);
        this.renderCardInPlay();
    }

    private updatePlayerHand(cardModel: CardModel): void {
        this.updatePlayerCards(cardModel);
        this.renderPlayerCards();
    }

    private updateOpponentHand(opponentHandCount: number): void {        
        this.updateOpponentCards(opponentHandCount);
        this.renderOpponentCards();
    }

    //GAME UPDATES

    private updateCardInPlay(cardModel: CardModel): void {
        this._cardInPlay = this.spawnCard(cardModel);
        this._cardInPlay.position.set(this.DISCARD_POS.x, this.DISCARD_POS.y);
    }

    private updatePlayerCards(cardModel: CardModel): void {
        let card: CardSprite = this.spawnCard(cardModel);
        card.on("mousedown", (e) => this.cardSelected(e.target));
        this._playerCards.push(card);
        // sort cards
        this._playerCards = this.sortCards(this._playerCards);
    }


    // this is a two player game - but using a possible multiple oppoent approach
    private updateOpponentCards(numCards: number): void {
        let cardsDifference: number = numCards - this._opponentCards.length;
        if (this._opponentCards.length < 1) this.updateAllOpponentCardsOnStart(numCards);
        else if (cardsDifference < 0) this.opponentPlayedCard();
        else if (cardsDifference > 0) this.opponentDrewCard(cardsDifference);
    }

    private updateAllOpponentCardsOnStart(numCards: number): void {
        for (let i = 0; i < numCards; i++) {
            let card: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
            card.anchor.set(.5, .5);
            card.position.set(100, 50);
            this._opponentCards.push(card);
        }
    }

    //GAME RENDERS

    private renderCardInPlay(): void {
        this._stage.addChild(this._cardInPlay);
        TweenLite.to(this._cardInPlay, this.GAME_SPEED, { x: this.DISCARD_POS.x, y: this.DISCARD_POS.y });
    }

    private renderPlayerCards(): void {
        let stageCenter: number = 512;
        let widthOfHand: number = this._playerCards.length * this.CARD_SIZE.width;
        let xPos = stageCenter - (widthOfHand / 2) + (this._playerCards[0].width / 2);
        let delay = 0;
        for (let sprite of this._playerCards) {
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
    }

    private renderOpponentCards(): void {
        let stageCenter: number = 512;
        let widthOfHand: number = this._opponentCards.length * this._opponentCards[0].width;
        let xPos = stageCenter - (widthOfHand / 2) + (this._opponentCards[0].width / 2);
        for (let sprite of this._opponentCards) {
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
    }

    private renderGame(): void {
        // possibly evaluate this on gamestate update
        if (this._playerCards.length > 0) this.renderPlayerCards();
        if (this._opponentCards.length > 0) this.renderOpponentCards();
        this.renderCardInPlay();
    }

    // GAME PLAY

    private cardSelected(card: CardSprite): void {
        if (!this._gameService.isCurrentPlayer || !this.isCardPlayable(card)) return;
        if (card.cardModel.isWild) { // use enum
            this._currentWildCard = card;
            this._showColorPicker = true;
        }
        else {
            this.playCard(card);
        }
    }

    private playCard(card): void {
        this.bringSpriteToFront(card);
        TweenLite.to(card, this.GAME_SPEED, {
            x: this.DISCARD_POS.x, y: this.DISCARD_POS.y,
            onUpdate: this.render,
            onUpdateScope: this,
            onComplete: this.cardPlayed,
            onCompleteScope: this,
            onCompleteParams: [card]
        });
    }

    private isCardPlayable(card: CardSprite): boolean {
        if (card.cardModel.value == this._cardInPlay.cardModel.value
            || card.cardModel.color == this._cardInPlay.cardModel.color || card.cardModel.isWild) return true;
        return false;
    }

    private cardPlayed(card: CardSprite): void {
        this.removeCardSpriteFromPlayerCards(card);
        this._gameService.playCard(card.cardModel);
        this.resetPlayerForNextTurn();
    }

    //TODO -using current tween list to determine if a move can be made.  Use more or not at all
    private drawCard(): void {
        if (this._numDrawsThisTurn > 0 || !this._gameService.isCurrentPlayer) return;
        if (!this.playPossible() && TweenMax.getAllTweens().length == 0) {
            this._numDrawsThisTurn++;
            this._gameService.drawCard();
        }
    }

    private playPossible(): boolean {
        let cardInPlayModel: CardModel = this._cardInPlay.cardModel;
        let playableCards: CardSprite[] = this._playerCards.filter(card =>
            card.cardModel.isWild ||
            card.cardModel.value == cardInPlayModel.value ||
            card.cardModel.color == cardInPlayModel.color);
        return playableCards.length > 0;
    }

    private opponentPlayedCard(): void {
        let r: number = Math.floor(Math.random() * this._opponentCards.length);
        let card: PIXI.Sprite = this._opponentCards[r];
        this._cardInPlay.position.set(card.x, card.y);
        this._stage.removeChild(card);
        this._opponentCards.splice(r, 1);
        this.renderCardInPlay();
    }

    private opponentDrewCard(numCards: number): void {
        for (let i = 0; i < numCards; i++) {
            let card: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
            card.anchor.set(.5, .5);
            card.position.set(this.DECK_POS.x, this.DECK_POS.y);
            this._opponentCards.push(card);
        }
    }

    private spawnCard(cardModel): CardSprite {
        let card: CardSprite = new CardSprite(cardModel);
        card.render();
        card.interactive = true;
        card.anchor.set(.5, .5);
        card.position.set(this.DECK_POS.x, this.DECK_POS.y);
        return card;
    }

    private colorPickerClicked(color: string): void {
        this._currentWildCard.updateForWild(color);
        this._showColorPicker = false;
        this.playCard(this._currentWildCard);
        this._currentWildCard = null;
    }









    /* 
      GAME EVALUATIONS
    */

    private evaluatePlayerHand(): void {
        console.log("draws", this._numDrawsThisTurn);
        if (this._gameService.isCurrentPlayer
            && !this.playPossible()
            && this._numDrawsThisTurn > 0) this.pass();
    }

    private resetPlayerForNextTurn(): void {
        this.renderPlayerCards();
        this._numDrawsThisTurn = 0;
    }

    private pass(): void {
        this._gameService.pass();
        this.resetPlayerForNextTurn();
    }

    /*
      UTILITY
    */

    private sortCards(cards: CardSprite[]): CardSprite[] {
        return cards.sort((a: CardSprite, b: CardSprite) => {
            if (a.cardModel.id < b.cardModel.id) return -1;
            if (a.cardModel.id > b.cardModel.id) return 1;
            return 0;
        });

    }

    private bringSpriteToFront(sprite: PIXI.Sprite): void {
        this._stage.removeChild(sprite);
        this._stage.addChild(sprite);
    }

    private removeCardSpriteFromPlayerCards(card: CardSprite): void {
        this._playerCards = this._playerCards.filter(c => card.cardModel.id != c.cardModel.id);
    }

    //update canvas
    private render(): void {
        if (!this._renderer) return;
        this._renderer.render(this._stage);
    }

}

