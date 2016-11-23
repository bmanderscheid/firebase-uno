import { Component, OnInit } from '@angular/core';
import { GameService } from '../app/game.service';
import { GameState } from '../app/game-state.model'
import { CardSprite } from '../app/card.sprite';
import { CardModel } from '../app/card.model';
import { PlayerModel } from '../app/player.model';

@Component({
  selector: 'game',
  template: '<div style="position:absolute">CURRENT PLAYER: {{_gameService.currentPlayer}}</div><div id="stage"></div>'
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
  private DISCARD_POS: any = { x: 600, y: 384 }
  private DECK_POS: any = { x: 450, y: 384 }

  //game play
  private _canDraw: boolean;

  //sprites
  private _playerCards: CardSprite[];
  private _opponentCards: PIXI.Sprite[];
  private _deck: PIXI.Sprite;

  private _cardInPlay: CardSprite;

  constructor(private _gameService: GameService) { }

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
    // draw initial UI
    this.drawUI();

    // initialize sprite containers
    this._playerCards = [];
    this._opponentCards = [];

    // init service and subscribe to game state changes
    this._gameService.init();
    this._gameService.gameState.subscribe((gameState: GameState) => {
      this._canDraw = gameState.lastMoveType != "draw"; // MOVE!!
      this.updateGame(gameState);
      this.renderGame();
      this.evaluateGame(gameState);
    });
  }

  private drawUI(): void {
    this._deck = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
    this._deck.position.set(this.DECK_POS.x, this.DECK_POS.y);
    this._deck.anchor.set(.5, .5);
    this._deck.interactive = true;
    this._deck.on("mousedown", (e) => this.drawCard());
    this._stage.addChild(this._deck);
  }

  /*
    GAME UPDTATE 
  */

  private updateGame(gameState: GameState): void {
    if (gameState.cardInPlay) this.updateCardInPlay(gameState.cardInPlay);
    if (gameState.hand) this.updatePlayerCards(gameState.hand);
    if (gameState.players) this.updateOpponentCards(gameState.players[this._gameService.opponent]);
  }

  private updateCardInPlay(cardModel: CardModel): void {
    this._cardInPlay = this.spawnCard(cardModel);
    this._cardInPlay.position.set(this.DISCARD_POS.x, this.DISCARD_POS.y);
  }

  private updatePlayerCards(playerHand: CardModel[]): void {
    for (let cardModel of playerHand) {
      // spawn card
      if (cardModel && !cardModel.spawned) {
        let card: CardSprite = this.spawnCard(cardModel);
        card.on("mousedown", (e) => this.playCard(e.target));
        this._playerCards.push(card);
      }
    }
    // sort cards
    this._playerCards = this.sortCards(this._playerCards);
  }

  private updateOpponentCards(opponent: any): void {
    let cardsDifference: number = opponent.cardsInHand - this._opponentCards.length;
    if (this._opponentCards.length < 1) this.updateAllOpponentCardsOnStart(opponent.cardsInHand);
    else if (cardsDifference < 0) this.opponentPlayedCard();
    else if (cardsDifference > 0) this.opponentDrewCard();
  }

  private updateAllOpponentCardsOnStart(numCards: number): void {
    for (let i = 0; i < numCards; i++) {
      let card: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
      card.anchor.set(.5, .5);
      card.position.set(100, 50);
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

  /*   
    GAME RENDER     
  */

  private renderGame(): void {
    // possibly evaluate this on gamestate update
    if (this._playerCards.length > 0) this.renderPlayerCards();
    if (this._opponentCards.length > 0) this.renderOpponentCards();
    this.renderCardInPlay();
  }

  private renderCardInPlay(): void {
    if (!this._cardInPlay) return;
    this._stage.addChild(this._cardInPlay);
    TweenLite.to(this._cardInPlay, this.GAME_SPEED, { x: this.DISCARD_POS.x, y: this.DISCARD_POS.y });
  }

  private renderPlayerCards(): void {
    let stageCenter: number = 512;
    let widthOfHand: number = this._playerCards.length * this._playerCards[0].width;
    let xPos = stageCenter - (widthOfHand / 2) + (this._playerCards[0].width / 2);
    for (let sprite of this._playerCards) {
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
  }

  // combine function with render player cards
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

  /*   
      GAME PLAY    
  */

  private playCard(card: CardSprite): void {
    if (!this._gameService.isCurrentPlayer) return;
    this.bringSpriteToFront(card);
    TweenLite.to(card, this.GAME_SPEED, {
      x: this.DISCARD_POS.x, y: this.DISCARD_POS.y,
      onUpdate: this.render,
      onUpdateScope: this,
      onComplete: this.evaluatePlayedCard,
      onCompleteScope: this,
      onCompleteParams: [card]
    });
  }

  private evaluatePlayedCard(card: CardSprite): void {
    if (card.cardModel.value == this._cardInPlay.cardModel.value
      || card.cardModel.color == this._cardInPlay.cardModel.color) {
      this.pullCardSpriteFromPlayerCards(card);
      this._gameService.playCard(card.cardModel);
      this.resetPlayerForNextTurn();
    }
    else {
      this.renderPlayerCards();
    }
  }

  private opponentPlayedCard(): void {
    let r: number = Math.floor(Math.random() * this._opponentCards.length);
    let card: PIXI.Sprite = this._opponentCards[r];
    this._cardInPlay.position.set(card.x, card.y);
    this._stage.removeChild(card);
    this._opponentCards.splice(r, 1);
  }

  private opponentDrewCard(): void {
    let card: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
    card.anchor.set(.5, .5);
    card.position.set(this.DECK_POS.x, this.DECK_POS.y);
    this._opponentCards.push(card);
  }

  //TODO -using current tween list to determine if a move can be made.  Use more or not at all
  private drawCard(): void {
    if (this._gameService.isCurrentPlayer && this._canDraw && TweenMax.getAllTweens().length == 0) {
      this._canDraw = false;
      this._gameService.drawCard();
    }
  }

  /* 
    GAME EVALUATIONS
  */

  private evaluateGame(gameState: GameState): void {
    TweenLite.killTweensOf(this.evaluateLastMove);
    TweenLite.delayedCall(1, this.evaluateLastMove, [gameState], this);
  }

  // TODO - move and use enum
  private evaluateLastMove(gameState: GameState): void {
    switch (gameState.lastMoveType) {
      case "draw":
        if (this._gameService.isCurrentPlayer && !this.isPlayPossible(gameState)) this.pass();
        break;
      default:
        break;
    }
  }

  private isPlayPossible(gameState: any): boolean {
    for (let card of gameState.hand) {
      if ((card.value == gameState.cardInPlay.value
        || card.color == gameState.cardInPlay.color)) return true;
    }
    return false;
  }

  private resetPlayerForNextTurn(): void {
    this._canDraw = true;
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

  private pullCardSpriteFromPlayerCards(card: CardSprite): void {
    this._playerCards = this._playerCards.filter(c => card.cardModel.id != c.cardModel.id);
  }

  //update canvas
  private render(): void {
    if (!this._renderer) return;
    this._renderer.render(this._stage);
  }

}

enum MoveType {
  INIT,
  PLAY,
  DRAW
}