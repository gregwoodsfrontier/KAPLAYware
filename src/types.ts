import { AudioPlay, AudioPlayOpt, GameObj, KAPLAYCtx, KEvent, KEventController, TimerComp } from "kaplay";
import { gameAPIs, loadAPIs } from "./kaplayware";
import { k } from "./main";

/** A button */
export type Button =
	| "action"
	| "left"
	| "right"
	| "up"
	| "down"
	| "click";

/** The allowed load functions */
export type LoadCtx = Pick<KAPLAYCtx, typeof loadAPIs[number]>;

/** The specific API for minigames */
export type MinigameAPI = {
	/**
	 * Register an event that runs once when a button is pressed.
	 */
	onButtonPress(btn: Button, action: () => void): KEventController;
	/**
	 * Register an event that runs once when a button is released.
	 */
	onButtonRelease(btn: Button, action: () => void): KEventController;
	/**
	 * Register an event that runs every frame when a button is held down.
	 */
	onButtonDown(btn: Button, action: () => void): KEventController;
	/**
	 * Register an event that runs once when timer runs out.
	 */
	onTimeout: (action: () => void) => KEventController;
	/**
	 * Run this when player succeeded in completing the game.
	 */
	win: () => void;
	/**
	 * Run this when player failed.
	 */
	lose: () => void;
	/**
	 * Run this when your minigame has 100% finished all win/lose animations etc
	 */
	finish: () => void;
	/**
	 * The current difficulty of the game
	 */
	difficulty: 1 | 2 | 3;
	/**
	 * The speed multiplier
	 */
	speed: number;
	/**
	 * The lives the player has left
	 */
	lives: number;
};

/** The context for the allowed functions in a minigame */
export type MinigameCtx = Pick<typeof k, typeof gameAPIs[number]> & MinigameAPI;

/** The type for a minigame */
export type Minigame = {
	/** Prompt of the mini game! */
	prompt: string;
	/** The author of the game */
	author: string;
	/** The RGB code for the game's backgroun */
	rgb?: [number, number, number];
	/** Wheter the games use the mouse, If you want to use a custom mouse you can set `hidden` to true */
	mouse?: { hidden: boolean; };
	/** How long the minigames goes for (choose a reasonable number) */
	duration?: number;
	/**
	 * Assets URL prefix.
	 */
	urlPrefix?: string;
	/**
	 * The function that loads the game's custom assets
	 *
	 * @example
	 * ```js
	 * load(ctx) {
	 * 	ctx.loadSprite("bean", "sprites/bean.png")
	 * }
	 * ```
	 */
	load?: (k: LoadCtx) => void;
	/**
	 * Main entry of the game code. Should return a game object made by `k.make()` that contains the whole game.
	 *
	 * @example
	 * ```js
	 * start(ctx) {
	 * 	const game = ctx.make();
	 * 	// (Your game code will be here...)
	 * 	return game;
	 * }
	 * ```
	 */
	start: (ctx: MinigameCtx) => GameObj;
};

export type KaplayWareCtx = {
	/** The KAPLAY context */
	kCtx: KAPLAYCtx;
	/** Wheter input is enabled */
	inputEnabled: boolean;
	/** Wheter the current game is running */
	gameRunning: boolean;
	/** The speed of the game */
	speed: number;
	/** The difficulty */
	difficulty: 1 | 2 | 3;
	/** The time left for a minigame to finish */
	time: number;
	/** The current score for the player */
	score: number;
	/** The amount of games played counting loses */
	gamesPlayed: number;
	/** The lives left */
	lives: number;
	/** The index of the game in the games array */
	gameIdx: number;
	/** The amount of times the game has sped up */
	timesSpeed: number;
	/** Resets the ware to initial state */
	reset: () => void;
	/** Transition to the next game */
	nextGame: () => void;
	/** Returns the current minigame */
	curGame: () => Minigame;
	/** Runs a minigame */
	runGame: (g: Minigame) => GameObj;
	/** Speeds up the game */
	speedUp: () => void;
};
