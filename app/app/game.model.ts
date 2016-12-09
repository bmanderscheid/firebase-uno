import { PlayerModel } from '../app/player.model';
import { GameStatus } from '../app/game-values';

export class GameModel {
    status: GameStatus
    players: PlayerModel[];
    date: string;
    title: string;
}