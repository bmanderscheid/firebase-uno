import { Component, OnInit } from '@angular/core';
import { GameService } from '../app/game.service';
import { GameStateChange } from '../app/game-state.model'
import { CardSprite } from '../app/card.sprite';
import { CardModel } from '../app/card.model';
import { PlayerModel } from '../app/player.model';
import { MoveType } from '../app/game-values';

@Component({
    selector: 'game',
    templateUrl: './app/game.component.html'
})
export class GameComponent implements OnInit {

<<<<<<< HEAD
  private _stage: PIXI.Container;
  private _renderer: PIXI.SystemRenderer;
  private _loader: PIXI.loaders.Loader;

  //move to config(s)
  private GAME_SPEED: number = .5;
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
  private _canDraw: boolean;

  //sprites
  private _playerCards: CardSprite[];
  private _opponentCards: PIXI.Sprite[];
  private _deck: PIXI.Sprite;

  private _cardInPlay: CardSprite;

  constructor(private _gameService: GameService) {
    this._firstGameStateUpdate = true;
    this._canDraw = true;
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

    
    // seriously flawed
    //evaluate a force turnover after game speed is complete
    TweenLite.delayedCall(this.GAME_SPEED, () => {
      if (this._gameService.isCurrentPlayer
        && !this._canDraw
        && this.isPlayPossible())this.pass();;
    })

  }

  private updatePlayerCards(): void {
    for (let cardModel of this._playerHand) {
      let spawnCard: boolean = false;
      if (this._firstGameStateUpdate) spawnCard = true;
      else
        if (!cardModel.rendered) spawnCard = true;
<<<<<<< HEAD
=======
      // spawn card
>>>>>>> 86cc596558e4da40746eff03b8217ffa00a3f2b1
      if (spawnCard) {
=======
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
    private _currentWildCard: CardSprite;

    //sprites
    private _playerCards: CardSprite[];
    private _opponentCards: PIXI.Sprite[];
    private _deck: PIXI.Sprite;

    private _cardInPlay: CardSprite;

    //dom
    private _showColorPicker: boolean;

    constructor(private _gameService: GameService) {
        this._showColorPicker = false;
        this._canDraw = true;
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
        // draw initial UI
        this.drawUI();
        this.initGameSubscriptions();

        // initialize sprite containers
        this._playerCards = [];
        this._opponentCards = [];
    }

    private drawUI(): void {
        this._deck = new PIXI.Sprite(PIXI.Texture.fromFrame("back.png"));
        this._deck.position.set(this.DECK_POS.x, this.DECK_POS.y);
        this._deck.anchor.set(.5, .5);
        this._deck.interactive = true;
        this._deck.on("mousedown", (e) => this.drawCard());
        this._stage.addChild(this._deck);
    }

    private initGameSubscriptions(): void {
        // init service and subscribe to game state changes
        this._gameService.init();
        this._gameService.gameState.subscribe((gameState: GameStateChange) => {
            if (gameState) this.gameStateChanged(gameState);
        });
    }

    private gameStateChanged(gameState: GameStateChange): void {
        switch (gameState.moveType) {
            case MoveType.CARD_ADDED_TO_HAND:
                if (gameState.cardAddedToHand) this.updatePlayerHand(gameState.cardAddedToHand);
                break;
            case MoveType.PLAYER_HAND_COUNTS_UPDATED:
                if (gameState.playerHandCounts) this.updateOpponentHands(gameState.playerHandCounts);
                break;
            case MoveType.CARD_IN_PLAY_UPDATED:
                if (gameState.cardInPlay) this.cardInPlayChanged(gameState.cardInPlay);
                break;
        }
    }

    //GAME CHAGES

    private cardInPlayChanged(cardModl: CardModel): void {
        this.updateCardInPlay(cardModl);
        this.renderCardInPlay(); // could be an issue.  Card might render in deck pos before getting opp turn update   
    }

    private updatePlayerHand(cardModel: CardModel): void {
        this.updatePlayerCards(cardModel);
        this.renderPlayerCards();
    }

    private updateOpponentHands(playerHandCounts: any): void {
        let opponents: any[] = Object.keys(playerHandCounts).
            map(key => playerHandCounts[key])
            .filter(player => player.uid != this._gameService.playerId);
        let opponent: any = opponents[0];
        this.updateOpponentCards(opponent.cardsInHand);
        this.renderOpponentCards();
    }

    //GAME UPDATES

    private updateCardInPlay(cardModel: CardModel): void {
        this._cardInPlay = this.spawnCard(cardModel);
        this._cardInPlay.position.set(this.DISCARD_POS.x, this.DISCARD_POS.y);
    }

    private updatePlayerCards(cardModel: CardModel): void {
>>>>>>> 0da1ab4f1fb7758135c8c828ec688e24cb6e0836
        let card: CardSprite = this.spawnCard(cardModel);
        card.on("mousedown", (e) => this.cardSelected(e.target));
        this._playerCards.push(card);
<<<<<<< HEAD
<<<<<<< HEAD
        spawnCard = false;
=======
        spawnCard = false
>>>>>>> 86cc596558e4da40746eff03b8217ffa00a3f2b1
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
    card.position.set(this.DECK_POS.x, this.DECK_POS.y);
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
      GAME EVALUATIONS AND ACTIONS    
  */

  private playCard(card: CardSprite): void {
    if (!this._gameService.isCurrentPlayer) return;
    this._stage.removeChild(card);
    this._stage.addChild(card);
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
<<<<<<< HEAD
      console.log("upate firebase now and stop controls");
=======
      this.pullCardSpriteFromPlayerCards(card);
      this._gameService.playCard(card.cardModel);
<<<<<<< HEAD
>>>>>>> 86cc596558e4da40746eff03b8217ffa00a3f2b1
=======
      this.resetPlayerForNextTurn();
>>>>>>> noFBArrays
    }
    else {
      this.renderPlayerCards();
    }
  }

  private drawCard(): void {
    if (this._canDraw) {
      this._canDraw = false;
      this._gameService.drawCard();
    }
  }

  private resetPlayerForNextTurn(): void {
    this._canDraw = true;
  }

  private isPlayPossible(): boolean {
    for (let card of this._playerHand) {
      if (card.value == this._cardModelInPlay.value
        || card.color == this._cardModelInPlay.color) return false;
    }
    console.log("no play possible");
    return true;
  }

  private pass(): void {
    this._gameService.pass();
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
=======
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


    // GAME PLAY

    private cardSelected(card: CardSprite): void {
        if (!this._gameService.isCurrentPlayer) return;
        this.bringSpriteToFront(card);
        if (card.cardModel.isWild) { // use enum
            this._currentWildCard = card;
            this._showColorPicker = true;
        }
        else {
            this.playCard(card);
        }
    }

    private playCard(card): void {
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
            || card.cardModel.color == this._cardInPlay.cardModel.color || card.cardModel.isWild) {
            this.pullCardSpriteFromPlayerCards(card);
            this._gameService.playCard(card.cardModel);
            this.resetPlayerForNextTurn();
        }
        else {
            this.renderPlayerCards();
        }
    }

    //TODO -using current tween list to determine if a move can be made.  Use more or not at all
    private drawCard(): void {
        if (this._gameService.isCurrentPlayer && this._canDraw && TweenMax.getAllTweens().length == 0) {
            this._canDraw = false;
            this._gameService.drawCard();
        }
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






































    /*
      GAME UPDTATE 
    */










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





    // combine function with render player cards


    /*   
        GAME PLAY    
    */



    private colorPickerClicked(color: string): void {
        this._currentWildCard.updateForWild(color);
        this._showColorPicker = false;
        this.playCard(this._currentWildCard);
        this._currentWildCard = null;
    }









    /* 
      GAME EVALUATIONS
    */

    private evaluateGame(gameState: GameStateChange): void {
        TweenLite.killTweensOf(this.evaluateLastMove);
        TweenLite.delayedCall(.3, this.evaluateLastMove, [gameState], this);
    }

    // TODO - move and use enum
    private evaluateLastMove(gameState: GameStateChange): void {
        // switch (gameState.lastMoveType) {
        //     case "draw":
        //         if (this._gameService.isCurrentPlayer && !this.isPlayPossible(gameState)) this.pass();
        //         break;
        //     case "draw2":
        //         if (this._gameService.isCurrentPlayer) this.drawMultipleCards(2);
        //         break;
        //     case "draw4":
        //         if (this._gameService.isCurrentPlayer) this.drawMultipleCards(4);
        //         break;
        //     default:
        //         break;
        // }
    }

    private drawMultipleCards(numCards: number): void {
        this._gameService.drawMultipleCards(numCards);
    }

    private isPlayPossible(gameState: any): boolean {
        for (let card of gameState.hand) {
            if ((card.value == gameState.cardInPlay.value
                || card.color == gameState.cardInPlay.color)) return true;
        }
        return false;
    }

    private resetPlayerForNextTurn(): void {
        this.renderPlayerCards();
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

>>>>>>> 0da1ab4f1fb7758135c8c828ec688e24cb6e0836
