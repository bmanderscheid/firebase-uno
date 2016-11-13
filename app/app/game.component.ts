import { Component, OnInit } from '@angular/core';
import { GameService } from '../app/game.service';
import { GameState } from '../app/game-state.model'
import { CardSprite } from '../app/card.sprite';
import { CardModel } from '../app/card.model';

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

  private _currentGameState: GameState;
  private _playerHand: CardModel[];

  private _firstGameStateUpdate: boolean; // render all cards on first load

  //sprites
  private _playerCards: CardSprite[];

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
    this._playerCards = [];
    this._gameService.init();
    this._gameService.gameState.subscribe((gameState: GameState) => {
      if (!gameState) return;
      this._currentGameState = gameState;
      this.updateGame();
      this.renderGame();
      this._firstGameStateUpdate = false; // set to false so rendered property is honored      
    })
  }

  /*
    GAME UPDTATE 
  */

  private updateGame(): void {
    // update realms    
    this._playerHand = this._currentGameState.hand;
    this.updatePlayerCards();
    this._playerCards.sort((a: CardSprite, b: CardSprite) => {
      if (a.cardModel.id < b.cardModel.id) return -1;
      if (a.cardModel.id > b.cardModel.id) return 1;
      return 0;
    });
  }

  private updatePlayerCards(): void {
    for (let cardModel of this._playerHand) {
      if (this._firstGameStateUpdate) {
        this.spawnCard(cardModel);
      }
      else {
        if (!cardModel.rendered) {
          this.spawnCard(cardModel);
        }
      }
    }
  }

  private spawnCard(cardModel): void {
    let card: CardSprite = new CardSprite(cardModel);
    card.render();
    card.interactive = true;
    card.anchor.set(.5, .5);
    card.position.set(100, 50);
    card.on("mousedown", (e) => this.playCard(e.target));
    this._playerCards.push(card);
  }

  /*   
    GAME RENDER     
  */

  private renderGame(): void {
    this.renderPlayerCards();
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

    //temp - move later
    TweenLite.delayedCall(.1, () => this.evaluateGame());
  }

  /*   
      GAME EVALUATIONS AND ACTIONS    
  */

  private evaluateGame(): void {
    if (this._gameService.isCurrentPlayer) this.enableMoves();
  }

  private enableMoves(): void {

  }

  private playCard(card: CardSprite): void {
    console.log(card);
    TweenLite.to(card, 1, {
      x: 0, y: 0,
      onUpdate: this.render,
      onUpdateScope: this
    });
  }

  private drawCard(): void {
    this._gameService.drawCard();
  }

  private render(): void {
    if (!this._renderer) return;
    this._renderer.render(this._stage);
  }

}