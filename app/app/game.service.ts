//imports
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { FirebaseService } from '../app/firebase.service'
import { GameState } from '../app/game-state.model'

import 'rxjs/add/operator/toPromise';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class GameService {

    private _gameState:Observable<GameState>;
    private _gameStateSource:BehaviorSubject<GameState>;

    constructor(private _firebaseService: FirebaseService) {
        this._gameStateSource = new BehaviorSubject<GameState>(null);
        this._gameState = this._gameStateSource.asObservable();
    }

    init(): void {
        this._firebaseService.auth();
        this._firebaseService.authenticated.subscribe((auth: boolean) => {
            if (auth) {
                this.initGameService();
            }
        });
    }

    private initGameService(): void {
        this._firebaseService.init();
        this._firebaseService.currentPlayer.subscribe((uid: string) => {
            if(Number(uid) < 0)return; // ignore first subscribe update        
            this.getGameState();
        })
    }

    private getGameState(): void {
        this._firebaseService.getGameState().then((response:GameState) => {            
            this._gameStateSource.next(response);
        });
    }

    get gameState():Observable<GameState>{
        return this._gameState;
    }    


}
