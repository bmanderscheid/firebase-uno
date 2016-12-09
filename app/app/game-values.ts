export enum MoveType {
    CARD_ADDED_TO_HAND,
    CARD_IN_PLAY_UPDATED,
    PLAYER_HAND_COUNTS_UPDATED,
}

export enum GameStatus {
    active,
    pending,
    complete
}