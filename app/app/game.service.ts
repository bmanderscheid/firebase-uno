//imports
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { FirebaseService } from '../app/firebase.service'
import { GameState } from '../app/game-state.model'
import { CardModel } from '../app/card.model'

import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class GameService {

    private _currentGameState:GameState;

    private _gameState: Observable<GameState>;
    private _gameStateSource: BehaviorSubject<GameState>;

    private _currentPlayer: string;

    private _playerHand: CardModel[];

    constructor(private _firebaseService: FirebaseService) {
        this._currentGameState = new GameState();
        this._currentGameState.hand = [];
        this._gameStateSource = new BehaviorSubject<GameState>(this._currentGameState);
        this._gameState = this._gameStateSource.asObservable();
        this._playerHand = [];
    }

    init(): void {
        this._firebaseService.init();
        this._firebaseService.playerHand.subscribe((card: CardModel) => {            
            if (card) this._currentGameState.hand.push(card);
            this.sendNextGameState();
        });
    }

    private sendNextGameState():void{
        this._gameStateSource.next(this._currentGameState);
    }

    private initGameService(): void {


    }

    private loadGame(): void {
        // this._firebaseService.getGameState().then((response: GameState) =>
        //     this._gameStateSource.next(response));
    }

    /*
        GAME ACTIONS
    */

    playCard(cardInPlay: CardModel): void {
        let gameState: GameState = this._gameStateSource.value;
        let playerHand: CardModel[] = this.removeCardFromHand(cardInPlay, gameState.hand);
        let newPlayerHand = playerHand.reduce((o, v, i) => {
            o[v.id] = v;
            return o;
        }, {});
        this._firebaseService.playCard(cardInPlay, newPlayerHand);
    }

    drawCard(): void {
        this._firebaseService.drawCardForCurrentUser();
    }

    // player passes - but update hand so render values get update
    pass(): void {
        let gameState: GameState = this._gameStateSource.value;
        let playerHand: CardModel[] = this._gameStateSource.value.hand;
        let newPlayerHand = playerHand.reduce((o, v, i) => {
            o[v.id] = v;
            return o;
        }, {});
        this._firebaseService.pass(newPlayerHand);
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
        return this._currentPlayer == this._firebaseService.playerId;
    }

    get currentPlayer(): string {
        return this._currentPlayer;
    }

    get playerId(): string {
        return this._firebaseService.playerId;
    }

}
