//imports
import { Injectable, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { FirebaseService } from '../app/firebase.service'
import { GameState } from '../app/game-state.model'
import { CardModel } from '../app/card.model'
import { PlayerModel } from '../app/player.model';
import { GameModel } from '../app/game.model';
import { MoveType } from '../app/game-values';

import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class GameService {

    private _currentGameState: GameState; // used to build game state

    private _gameState: Observable<GameState>; // used to shoot component the current game state
    private _gameStateSource: BehaviorSubject<GameState>;

    private _currentPlayerIndex: number;

    private _game: GameModel; // overall game information.  Does not update
    private _playerId: string;
    private _player: PlayerModel;
    private _opponent: PlayerModel; // gross - tied to 2 player only

    constructor(private _firebaseService: FirebaseService) {
        this._currentGameState = new GameState();
        this._gameStateSource = new BehaviorSubject<GameState>(this._currentGameState);
        this._gameState = this._gameStateSource.asObservable();
    }

    init(): void {
        // just getting getting by before dashboard
        this._firebaseService.auth();
        this._firebaseService.getGame()
            .then((gameData: any) => this.setGameData(gameData.val()));
    }

    private setGameData(gameData: GameModel): void {
        // set this player        
        this._playerId = this._firebaseService.playerId; //change how you set this        
        this._player = gameData.players.filter(player => player.uid == this._playerId)[0];
        this._opponent = gameData.players.filter(player => player.uid != this._playerId)[0];
        this.startGame();
    }

    private startGame(): void {
        this._firebaseService.currentPlayerIndex.subscribe((playerIndex: number) => this._currentPlayerIndex = playerIndex);
        this._firebaseService.playerHand.subscribe((card: CardModel) => {
            if(!card)return;
            this._currentGameState.cardAddedToHand = card;
            this._currentGameState.moveType = MoveType.CARD_ADDED_TO_HAND;
            this.sendNextGameState();
        });
        this._firebaseService.oppoentHandCount.subscribe((data: any) => {                
            if(!data)return;                    
            this._currentGameState.opponentHandCount = data[this._opponent.uid].cardsInHand;
            this._currentGameState.moveType = MoveType.OPPONENT_HAND_UPDATED;
            this.sendNextGameState();
        });
        this._firebaseService.cardInPlay.subscribe((card: CardModel) => {
            if(!card)return;
            this._currentGameState.cardInPlay = card;
            this._currentGameState.moveType = MoveType.CARD_IN_PLAY_UPDATED
            this.sendNextGameState();
        });
    }

    private sendNextGameState(): void {
        this._gameStateSource.next(this._currentGameState);
    }

    /*
        GAME ACTIONS
    */

    playCard(card: CardModel): void {
        if (card.opponentDraw > 0) {
            this._firebaseService.playCard(card, false);
            this._firebaseService.playDrawCard(card, this._opponent.uid);
        }
        else {
            this._firebaseService.playCard(card);
        }
    }

    drawCard(): void {
        this._firebaseService.drawCard();
    }

    pass(): void {
        this._firebaseService.pass();
    }

    /*
        UTILITY
    */
    removeCardFromHand(card: CardModel, hand: CardModel[]): CardModel[] {
        return hand.filter(c => c.id != card.id)
    }

    //GET SET

    get gameState(): Observable<GameState> {
        return this._gameState;
    }

    get isCurrentPlayer(): boolean {
        return this._player.turnOrder == this._currentPlayerIndex;
    }

    get opponent(): any {
        return this._game.players.filter(player => player.uid != this._firebaseService.playerId)[0].uid;
    }

    get playerId(): string {
        return this._firebaseService.playerId;
    }

    get currentPlayer(): number {
        return this._currentPlayerIndex;
    }

}
