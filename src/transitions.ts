import { AudioPlay, KAPLAYCtx } from "kaplay";
import { Conductor } from "./conductor";
import { friends } from "./kaplayware";
import { addPrompt, makeConfetti, makeFriend, makeHeart, makeHearts, makeScoreText } from "./objects";
import { KaplayWareCtx } from "./types";

let sunAngle = 0;
let cloudX = 40;
let cloudY = 40;

function makeCloud(k: KAPLAYCtx) {
	const cloud = k.make([
		k.sprite("@cloud"),
		k.pos(cloudX, cloudY),
		k.anchor("center"),
		k.scale(2),
	]);

	cloud.onUpdate(() => {
		if (cloudX >= k.width() + cloud.width / 2) cloudX = -k.width / 2;
		cloud.pos.x = k.lerp(cloud.pos.x, cloudX, 0.5);
		cloud.pos.y = cloudY;
	});

	return cloud;
}

function makeSun(k: KAPLAYCtx) {
	const sun = k.make([
		k.sprite("@sun"),
		k.pos(k.vec2(k.width() - 70, 70)),
		k.rotate(0),
		k.anchor("center"),
		k.scale(2),
	]);

	sun.onUpdate(() => {
		sunAngle = sunAngle % 360;
		sun.angle = k.lerp(sun.angle, sunAngle, 0.5);
	});

	return sun;
}

export function prepTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(141, 183, 255);
	const sound = k.play("@prepJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;
	const conductor = new Conductor(k, sound, 140 * ware.speed);
	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	if (sunAngle == null) sunAngle = 0;

	function onHalf(action: () => void) {
		const ev = transition.onUpdate(() => {
			if (sound.time() >= DURATION / 2 && ev) {
				ev.cancel();
				action();
			}
		});
	}

	function onEnd(action: () => void) {
		return transition.wait(DURATION, () => {
			action();
		});
	}

	function onQuarterToEnd(action: () => void) {
		const ev = transition.onUpdate(() => {
			if (sound.time() >= (DURATION / 2) + (DURATION * 0.25) && ev) {
				ev.cancel();
				action();
			}
		});
	}

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(0, k.center().y),
	]);

	topBg.add(makeCloud(k)).onUpdate(() => cloudX += 1 * ware.speed);
	topBg.add(makeSun(k)).onUpdate(() => sunAngle += 0.1 * ware.speed);

	const ground = botBg.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() }),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() / 2 - 40)),
	]);

	const bean = ground.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() / 2, 0)),
	]);

	const scoreText = topBg.add(makeScoreText(k, ware.score - 1));
	const hearts = makeHearts(k, botBg, ware.lives);

	let scoreTextAngle = 0;
	conductor.onBeat((beat) => {
		scoreTextAngle = beat % 2 == 0 ? -20 : 20;

		const BEAN_SCALE = 2.5;
		transition.tween(BEAN_SCALE * 0.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		transition.tween(BEAN_SCALE * 1.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.x = p, k.easings.easeOutQuint);
		hearts.forEach((heart) => {
			transition.tween(1, 2, conductor.beatInterval, (p) => heart.scale.y = p, k.easings.easeOutQuint);
			transition.tween(2.5, 2, conductor.beatInterval, (p) => heart.scale.x = p, k.easings.easeOutQuint);
		});
	});

	scoreText.onUpdate(() => scoreText.angle = k.lerp(scoreText.angle, scoreTextAngle, 0.25));
	transition.wait(DURATION / 4, () => {
		const TIME_LEFT = DURATION - DURATION / 4;
		scoreText.text = ware.score.toString();
		transition.tween(k.vec2(4), k.vec2(6), TIME_LEFT / 4, (p) => scoreText.scale = p, k.easings.easeOutQuint).onEnd(() => {
			transition.wait(TIME_LEFT / 4, () => {
				transition.tween(k.vec2(6), k.vec2(4), TIME_LEFT / 4, (p) => scoreText.scale = p, k.easings.easeOutQuint);
			});
		});
	});

	onQuarterToEnd(() => {
		topBg.pos.y = 0;
		botBg.pos.y = k.center().y;
		transition.tween(topBg.pos.y, -topBg.height, DURATION / 5, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
		transition.tween(botBg.pos.y, k.height(), DURATION / 5, (p) => botBg.pos.y = p, k.easings.easeOutQuint);
	});

	onEnd(() => {
		transition.removeAll();
		conductor.destroy();
	});

	return {
		onHalf: onHalf,
		onEnd: onEnd,
	};
}

export function winTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(141, 183, 255);
	const sound = k.play("@winJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;
	const conductor = new Conductor(k, sound, 140 * ware.speed);
	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	function onHalf(action: () => void) {
		const ev = transition.onUpdate(() => {
			if (sound.time() >= DURATION / 2 && ev) {
				ev.cancel();
				action();
			}
		});
	}

	function onEnd(action: () => void) {
		return transition.wait(DURATION, () => {
			action();
		});
	}

	// because of the shake
	const bg = transition.add([
		k.rect(k.width() * 2, k.height() * 2),
		k.color(SKY_COLOR),
		k.pos(k.center()),
		k.anchor("center"),
		k.opacity(0),
	]);

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
		k.z(1),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, k.center().y)),
	]);

	cloudX = k.rand(k.center().x - 40, k.center().x + 40);
	topBg.add(makeCloud(k)).onUpdate(() => cloudX += 1 * ware.speed);
	topBg.add(makeSun(k)).onUpdate(() => sunAngle += 0.5 * ware.speed);

	const trophy = k.add([
		k.sprite("@trophy"),
		k.anchor("bot"),
		k.pos(k.vec2(k.center().x - 60, -40)),
	]);

	const ground = botBg.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() }),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() / 2 - 40)),
	]);

	const bean = ground.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() / 2, 0)),
	]);

	const mark = ground.add([
		k.sprite("@mark"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() + 80, 0)),
		k.rotate(0),
	]);

	const scoreText = topBg.add(makeScoreText(k, ware.score - 1));
	const hearts = makeHearts(k, botBg, ware.lives);

	let heartToBop = -1;
	let scoreTextAngle = 0;
	conductor.onBeat((beat) => {
		scoreTextAngle = beat % 2 == 0 ? -20 : 20;
		heartToBop = (heartToBop + 1) % ware.lives;

		const BEAN_SCALE = 2.5;
		transition.tween(BEAN_SCALE * 0.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		transition.tween(BEAN_SCALE * 1.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.x = p, k.easings.easeOutQuint);
		if (hearts[heartToBop]) {
			transition.tween(k.vec2(3), k.vec2(2), conductor.beatInterval, (p) => hearts[heartToBop].scale = p, k.easings.easeOutQuint);
		}
	});

	topBg.pos.y = -topBg.height;
	botBg.pos.y = k.height() + botBg.height;
	scoreText.onUpdate(() => scoreText.angle = k.lerp(scoreText.angle, scoreTextAngle, 0.25));
	transition.tween(topBg.pos.y, 0, DURATION / 6, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
	transition.tween(botBg.pos.y, botBg.height, DURATION / 6, (p) => botBg.pos.y = p, k.easings.easeOutQuint).onEnd(() => bg.opacity = 1);

	// trophy falls down
	transition.tween(-trophy.height, k.height() - 38, DURATION / 4, (p) => trophy.pos.y = p, k.easings.linear).onEnd(() => {
		k.shake(10);
		// bean jumps
		transition.tween(bean.pos.y, bean.pos.y - bean.height * 2, DURATION / 8, (p) => bean.pos.y = p).onEnd(() => {
			transition.tween(bean.pos.y, bean.pos.y + bean.height * 2, DURATION / 8, (p) => bean.pos.y = p);
		});

		// mark goes swipes it away
		const SWIPE_TIME = (DURATION - sound.time()) * 0.5;
		transition.tween(mark.pos.x, -mark.width * 2, SWIPE_TIME, (p) => mark.pos.x = p);
		let markTookTrophy = false;
		mark.onUpdate(() => {
			mark.angle = k.wave(-20, 20, (k.time() * 10) / ware.speed);
			if (mark.pos.x <= trophy.pos.x && !markTookTrophy) {
				markTookTrophy = true;
				trophy.onUpdate(() => trophy.pos.x = mark.pos.x);
			}
		});
	});

	onEnd(() => {
		transition.removeAll();
		conductor.destroy();
	});

	return {
		onHalf: onHalf,
		onEnd: onEnd,
	};
}

export function loseTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(60, 92, 148);
	const HAPPY_SKY_COLOR = k.rgb(141, 183, 255);

	const sound = k.play("@loseJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;
	const conductor = new Conductor(k, sound, 140 * ware.speed);

	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(0, k.center().y),
	]);

	const cloud = topBg.add([
		k.sprite("@cloud"),
		k.pos(k.vec2(k.rand(10, k.center().x), k.rand(80, 90))),
		k.scale(2),
		k.anchor("center"),
		k.z(1),
		k.opacity(),
	]);

	const sun = topBg.add([
		k.sprite("@sun"),
		k.pos(k.vec2(k.width() - 70, 70)),
		k.rotate(0),
		k.anchor("center"),
		k.scale(2),
	]);

	sun.onUpdate(() => {
		cloud.pos = sun.pos;
		sun.angle += 0.1 * ware.speed;
	});

	const ground = botBg.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() }),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() / 2 - 40)),
	]);

	const bean = ground.add([
		k.sprite("@beant"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() / 2, 0)),
	]);

	const scoreText = topBg.add(makeScoreText(k, ware.score - 1));
	const hearts = makeHearts(k, botBg, k.clamp(ware.lives + 1, 0, 4));
	hearts[hearts.length - 1].kill();

	let soundAtHalf = false;
	let quarterToEnd = false;

	transition.onUpdate(() => {
		if (sound.time() >= DURATION / 2 && !soundAtHalf) {
			soundAtHalf = true;
		}

		if (sound.time() >= (DURATION / 2 + DURATION * 0.25) && !quarterToEnd) {
			quarterToEnd = true;
			const TIME_LEFT = DURATION - sound.time();
			cloud.fadeOut(TIME_LEFT);
			transition.tween(topBg.color, HAPPY_SKY_COLOR, TIME_LEFT, (p) => topBg.color = p);
			transition.tween(botBg.color, HAPPY_SKY_COLOR, TIME_LEFT, (p) => botBg.color = p);
		}
	});

	transition.tween(-topBg.height, 0, DURATION / 4, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
	transition.tween(k.height() + botBg.height, k.height() / 2, DURATION / 4, (p) => botBg.pos.y = p, k.easings.easeOutQuint);
	transition.tween(bean.scale.y, 2.5 * 0.5, DURATION / 2, (p) => bean.scale.y = p, k.easings.easeOutQuint).onEnd(() => {
		transition.tween(bean.scale.y, 2.5, DURATION / 2, (p) => bean.scale.y = p, k.easings.easeOutElastic);
	});

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= DURATION / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: (action: () => void) => {
			const wait = transition.wait(DURATION, () => {
				wait.cancel();
				transition.removeAll();
				conductor.destroy();
				action();
			});
			return wait;
		},
	};
}

export function speedupTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@speedJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;
	const conductor = new Conductor(k, sound, 140 * ware.speed);
	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	function onEnd(action: () => void) {
		return transition.wait(DURATION, () => {
			action();
		});
	}

	// only 1 bg since it doesn't need to open and close like the others
	const bg = transition.add([
		k.rect(k.width() * 2, k.height() * 2),
		k.color(),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	let camOffset = 0;
	let camAngle = 0;
	let spinSpeed = 0.1;
	transition.onUpdate(() => {
		camAngle = camAngle + spinSpeed;
		const TIME_TO_FINISH = sound.time() >= DURATION / 2 + DURATION / 4;
		const HUE = (k.time() * (spinSpeed * 10)) % 1;

		if (TIME_TO_FINISH) bg.color = k.lerp(bg.color, k.rgb(141, 183, 255), 0.1);
		else bg.color = k.lerp(bg.color, k.hsl2rgb(HUE, 0.7, 0.8), 0.5);

		// time to finish
		if (TIME_TO_FINISH) {
			camOffset = k.lerp(camOffset, 1, 0.1);
			spinSpeed = k.lerp(spinSpeed, 0.5, 0.5);
		}
		// getting faster!!
		else if (sound.time() >= DURATION / 2) {
			camOffset = k.lerp(camOffset, 20, 0.1);
			spinSpeed = k.lerp(spinSpeed, 0.2, 0.5);
		}
		// initial fast
		else {
			camOffset = k.lerp(camOffset, 10, 0.1);
			spinSpeed = k.lerp(spinSpeed, 0.1, 0.5);
		}

		// X = magnitude * Math.cos(angle) :sunglasses:
		const camX = k.center().x + camOffset * Math.cos(camAngle);
		const camY = k.center().y + camOffset * Math.sin(camAngle);
		k.setCamPos(camX, camY);
	});

	const cloud = transition.add(makeCloud(k));
	cloud.onUpdate(() => {
		cloudX += spinSpeed * 10;
	});
	const sun = transition.add(makeSun(k));
	sun.onUpdate(() => sunAngle += spinSpeed);

	const ground = transition.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() * 2 }),
		k.color(k.WHITE),
		k.anchor("top"),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(-k.width() / 2, k.height() - 40)),
	]);

	const bean = transition.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.z(1),
		k.pos(k.center().x, k.height() - 40),
	]);

	const scoreText = transition.add(makeScoreText(k, ware.score - 1));
	const hearts = makeHearts(k, bg, ware.lives);
	hearts.forEach((heart) => heart.pos.x -= 50);

	const prompt = addPrompt(k, "SPEED UP", 0.25 / ware.speed);
	conductor.onBeat((beat) => {
		const theAngle = beat % 2 == 0 ? -20 : 20;
		const BEAN_SCALE = 2.5;
		transition.tween(BEAN_SCALE * 0.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		transition.tween(BEAN_SCALE * 1.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.x = p, k.easings.easeOutQuint);
		hearts.forEach((heart) => {
			transition.tween(1, 2, conductor.beatInterval, (p) => heart.scale.y = p, k.easings.easeOutQuint);
			transition.tween(2.5, 2, conductor.beatInterval, (p) => heart.scale.x = p, k.easings.easeOutQuint);
		});
		transition.tween(2, 1, 0.15, (p) => prompt.scale.y = p, k.easings.easeOutQuint);
	});

	let friendsAmount = 3;
	let friendsChosen: string[] = [];
	const friendsLoop = transition.loop(DURATION / 4, () => {
		friendsAmount--;
		if (friendsAmount = 0) {
			friendsLoop.cancel();
			return;
		}

		const friendToAdd = k.choose(friends.filter((friendThing) => !friendsChosen.includes(friendThing)));
		const friend = transition.add(makeFriend(k, friendToAdd));
		const direction = k.choose([-1, 1]);
		friend.pos.y = bean.pos.y;
		if (direction == -1) transition.tween(-k.width() - friend.width * 2, k.width() + friend.width * 2, DURATION / 3.5, (p) => friend.pos.x = p);
		else transition.tween(k.width() + friend.width * 2, -k.width() - friend.width * 2, DURATION / 3.5, (p) => friend.pos.x = p);
		friend.onUpdate(() => {
			friend.angle = k.wave(-20, 20, (k.time() * 10) / ware.speed);
		});
	});

	onEnd(() => {
		transition.removeAll();
		transition.destroy();
		conductor.destroy();
		prompt.fadeOut(0.05).onEnd(() => prompt.destroy());
	});

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= DURATION / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: onEnd,
	};
}
