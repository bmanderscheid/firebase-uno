import { CardModel } from '../app/card.model';
import { PlayerModel } from '../app/player.model';

export class GameState {    
    hand: CardModel[];
    players: PlayerModel[];
    cardInPlay: CardModel;
}
