"use strict";
(function (MoveType) {
    MoveType[MoveType["CARD_ADDED_TO_HAND"] = 0] = "CARD_ADDED_TO_HAND";
    MoveType[MoveType["CARD_IN_PLAY_UPDATED"] = 1] = "CARD_IN_PLAY_UPDATED";
    MoveType[MoveType["PLAYER_HAND_COUNTS_UPDATED"] = 2] = "PLAYER_HAND_COUNTS_UPDATED";
})(exports.MoveType || (exports.MoveType = {}));
var MoveType = exports.MoveType;
(function (GameStatus) {
    GameStatus[GameStatus["active"] = 0] = "active";
    GameStatus[GameStatus["pending"] = 1] = "pending";
    GameStatus[GameStatus["complete"] = 2] = "complete";
})(exports.GameStatus || (exports.GameStatus = {}));
var GameStatus = exports.GameStatus;
//# sourceMappingURL=game-values.js.map