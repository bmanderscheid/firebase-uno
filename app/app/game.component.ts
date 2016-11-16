import { Component, OnInit } from '@angular/core';
import { GameService } from '../app/game.service';
import { GameState } from '../app/game-state.model'
import { CardSprite } from '../app/card.sprite';
import { CardModel } from '../app/card.model';
import { PlayerModel } from '../app/player.model';

@Component({
  selector: 'game',
  template: '<div id="stage"></div>'
})
export class GameComponent implements OnInit {

  private _stage: PIXI.Container;
  private _renderer: PIXI.SystemRenderer;
  private _loader: PIXI.loaders.Loader;

  //move to config(s)
  private PLAYER_REALM_Y: number = 640;
  private OPPONENT_REALM_Y: number = 140;
  private DISCARD_POS: any = { x: 600, y: 384 }
  private DECK_POS: any = { x: 450, y: 384 }

  //game state
  private _currentGameState: GameState;
  private _playerHand: CardModel[];
  private _cardModelInPlay: CardModel;
  private _opponentNumCards: number;

  private _firstGameStateUpdate: boolean; // render all cards on first load

  //sprites
  private _playerCards: CardSprite[];
  private _opponentCards: PIXI.Sprite[];
  private _deck: PIXI.Sprite;

  private _cardInPlay: CardSprite;

  constructor(private _gameService: GameService) {
    this._firstGameStateUpdate = true;
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
    this._playerCards = [];
    this._opponentCards = [];
    this._gameService.init();
    this._gameService.gameState.subscribe((gameState: GameState) => {
      if (!gameState) return;
      this._currentGameState = gameState;
      this.updateGame();
      this.renderGame();
      this._firstGameStateUpdate = false; // set to false so rendered property is honored      
    })
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

  private updateGame(): void {
    // card in playCard
    this._cardModelInPlay = this._currentGameState.cardInPlay;
    this._cardInPlay = this.spawnCard(this._cardModelInPlay);
    this._cardInPlay.position.set(this.DISCARD_POS.x, this.DISCARD_POS.y);

    // player hand     
    this._playerHand = this._currentGameState.hand;
    this.updatePlayerCards();
    this._playerCards.sort((a: CardSprite, b: CardSprite) => {
      if (a.cardModel.id < b.cardModel.id) return -1;
      if (a.cardModel.id > b.cardModel.id) return 1;
      return 0;
    });

    // opponent hand
    // sloppy player management.  Wanting to move on so this will do for now

    let opponent: PlayerModel = this._currentGameState.players
      .filter(player => player.uid != this._gameService.playerId)[0];
    this._opponentNumCards = opponent.cardsInHand;
    this.updateOpponentCards();

  }

  private updatePlayerCards(): void {
    for (let cardModel of this._playerHand) {
      let spawnCard: boolean = false;
      if (this._firstGameStateUpdate) spawnCard = true;
      else
        if (!cardModel.rendered) spawnCard = true;
      // spawn card
      if (spawnCard) {
        let card: CardSprite = this.spawnCard(cardModel);
        card.on("mousedown", (e) => this.playCard(e.target));
        this._playerCards.push(card);
        spawnCard = false
      }
    }
  }

  private updateOpponentCards(): void {
    let cardsDifference: number = this._opponentNumCards - this._opponentCards.length;    
    if (this._firstGameStateUpdate) this.updateOpponentAllOpponentCardsOnStart();
    else
      if (cardsDifference < 0) this.opponentCardPlay();
      else if (cardsDifference > 0) this.opponentDrawCard();
  }

  private updateOpponentAllOpponentCardsOnStart(): void {
    for (let i = 0; i < this._opponentNumCards; i++) {
      let card: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
      card.anchor.set(.5, .5);
      card.position.set(100, 50);
      this._opponentCards.push(card);
    }
  }

  private opponentCardPlay(): void {
    //this._opponentCards[0].texture = this._cardInPlay.texture;
    let r: number = Math.floor(Math.random() * this._opponentCards.length);
    let card: PIXI.Sprite = this._opponentCards[r];
    this._cardInPlay.position.set(card.x, card.y);
    this._stage.removeChild(card);
    this._opponentCards.splice(r, 1);
  }

  private opponentDrawCard(): void {
    let card: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
    card.anchor.set(.5, .5);
    card.position.set(this.DECK_POS.x, this.DECK_POS.y);
    this._opponentCards.push(card);
  }

  private spawnCard(cardModel): CardSprite {
    let card: CardSprite = new CardSprite(cardModel);
    card.render();
    card.interactive = true;
    card.anchor.set(.5, .5);
    card.position.set(100, 50);
    return card;
  }

  /*   
    GAME RENDER     
  */

  private renderGame(): void {
    this.renderPlayerCards();
    this.renderOpponentCards();
    this.renderCardInPlay();
  }

  private renderCardInPlay(): void {
    this._stage.addChild(this._cardInPlay);
    TweenLite.to(this._cardInPlay, .5, { x: this.DISCARD_POS.x, y: this.DISCARD_POS.y });
  }

  private renderPlayerCards(): void {
    let stageCenter: number = 512;
    let widthOfHand: number = this._playerCards.length * this._playerCards[0].width;
    let xPos = stageCenter - (widthOfHand / 2) + (this._playerCards[0].width / 2);
    for (let sprite of this._playerCards) {
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
  }

  // combine function with render player cards
  private renderOpponentCards(): void {
    let stageCenter: number = 512;
    let widthOfHand: number = this._opponentCards.length * this._opponentCards[0].width;
    let xPos = stageCenter - (widthOfHand / 2) + (this._opponentCards[0].width / 2);
    for (let sprite of this._opponentCards) {
      this._stage.addChild(sprite);
      TweenLite.to(sprite, .5, {
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
      GAME EVALUATIONS AND ACTIONS    
  */

  private enableMoves(): void {

  }

  private playCard(card: CardSprite): void {
    if (!this._gameService.isCurrentPlayer) return;
    this._stage.removeChild(card);
    this._stage.addChild(card);
    TweenLite.to(card, .4, {
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
    }
    else {
      this.renderPlayerCards();
    }
  }

  private drawCard(): void {
    this._gameService.drawCard();
  }

  /*
    UTILITY
  */
  private pullCardSpriteFromPlayerCards(card: CardSprite): void {
    this._playerCards = this._playerCards.filter(c => card.cardModel.id != c.cardModel.id);
  }

  private render(): void {
    if (!this._renderer) return;
    this._renderer.render(this._stage);
  }

}