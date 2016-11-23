//imports
import { Injectable, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { FirebaseService } from '../app/firebase.service'
import { GameState } from '../app/game-state.model'
import { CardModel } from '../app/card.model'
import { PlayerModel } from '../app/player.model';
import { GameModel } from '../app/game.model';

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

    // fuck you
    private _opponentId: string;

    constructor(private _firebaseService: FirebaseService) {
        this._currentGameState = new GameState();
        this._currentGameState.hand = [];
        this._gameStateSource = new BehaviorSubject<GameState>(this._currentGameState);
        this._gameState = this._gameStateSource.asObservable();        
    }

    init(): void {
        // just getting getting by before dashboard
        this._firebaseService.auth();
        this._firebaseService.getGame()
            .then((gameData: any) => {
                this._game = gameData.val() as GameModel;
                this.startGame();
            });
    }

    private startGame(): void {
        this._firebaseService.playerHand.subscribe((card: CardModel) => {
            if (card) this._currentGameState.hand.push(card);            
            this.sendNextGameState();
        });
        this._firebaseService.gameState.subscribe((gameState: any) => {
            if (gameState) {                
                this._currentPlayerIndex = gameState.currentPlayer;                
                this._currentGameState.cardInPlay = gameState.cardInPlay;
                this._currentGameState.players = gameState.players;    
                this._currentGameState.lastMoveType = gameState.lastMoveType;                
                console.log(this._currentGameState);
            }
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
        let gameState: GameState = this._gameStateSource.value;
        gameState.hand = gameState.hand.filter(c => c.id != card.id);
        this._firebaseService.playCard(card, gameState.hand.length);
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
        return this._game.players[this._currentPlayerIndex].uid == this._firebaseService.playerId;
    }

    get opponent(): any {
        return this._game.players.filter(player => player.uid != this._firebaseService.playerId)[0].uid;
    }

    get currentPlayer(): number {
        return this._currentPlayerIndex;
    }

    get playerId(): string {
        return this._firebaseService.playerId;
    }

    get game(): GameModel {
        return this._game;
    }

}
