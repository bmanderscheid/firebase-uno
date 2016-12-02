export class CardModel {
    id: string;
    color: string;    
    spawned: boolean = false;
    value: number;
    isWild: boolean = false;
    opponentDraw: number = 0;
}