import { CardModel } from '../app/card.model';
import { MoveType } from '../app/game-values';

export class GameState {
    moveType: MoveType;
    cardAddedToHand: CardModel;
    cardInPlay: CardModel;
    opponentHandCount: any;
}
