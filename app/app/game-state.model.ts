import { CardModel } from '../app/card.model';

export class GameState {
    players: any[];
    hand: CardModel[];
    cardInPlay: CardModel;
}
