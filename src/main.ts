import kaboom from "kaboom";
import { myMap } from "./mapData";

const k = kaboom({
  width: 768,
  height: 640,
  letterbox: true,
  background: [186, 224, 142],
});

const MAP_SCALE = 2;

// --- ASSET LOADING ---
k.loadSprite("village", "/pixel-poets.png");
k.loadSprite("player", "/player.png", {
  sliceX: 4,
  sliceY: 4,
  anims: {
    idleDown: { from: 0, to: 1, loop: true, speed: 4 },
    walkDown: { from: 2, to: 3, loop: true, speed: 8 },
    idleUp: { from: 4, to: 5, loop: true, speed: 4 },
    walkUp: { from: 6, to: 7, loop: true, speed: 8 },
    idleLeft: { from: 8, to: 9, loop: true, speed: 4 },
    walkLeft: { from: 10, to: 11, loop: true, speed: 8 },
    idleRight: { from: 12, to: 13, loop: true, speed: 4 },
    walkRight: { from: 14, to: 15, loop: true, speed: 8 },
  },
});

k.loadSound("bgm", "/Alexandra.mp3");

k.loadSprite("chest", "/Chest.png", {
  sliceX: 5,
  sliceY: 2,
  anims: {
    closed: { from: 0, to: 0 },
    open: { from: 0, to: 4, speed: 10, loop: false },
  },
});

// --- START MENU SCENE ---
k.scene("start", () => {
  k.add([
    k.rect(k.width(), k.height()),
    k.color(24, 20, 37), 
    k.z(0),
  ]);

  k.add([
    k.text("PIXEL POETS", { size: 48 }),
    k.pos(k.width() / 2, k.height() / 4),
    k.anchor("center"),
    k.color(255, 235, 59), 
  ]);

  k.add([
    k.text(
      "Controls:\n\n[ WASD ] or [ ARROWS ] to move.\n[ ENTER ] or Tap Chest to open.\n\nFind the chests to uncover hidden poems.",
      { size: 24, align: "center", lineSpacing: 12 }
    ),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.color(255, 255, 255),
  ]);

  const startPrompt = k.add([
    k.text("Press ENTER or Tap to Start", { size: 18 }),
    k.pos(k.width() / 2, k.height() - 100),
    k.anchor("center"),
    k.color(150, 150, 150),
  ]);

  k.loop(0.8, () => {
    startPrompt.hidden = !startPrompt.hidden;
  });

  k.onKeyPress("enter", () => k.go("main"));
  k.onMousePress(() => k.go("main"));
});

// --- MAIN GAME SCENE ---
k.scene("main", () => {
  k.add([k.sprite("village"), k.pos(0, 0), k.scale(MAP_SCALE), k.z(0)]);

  const player = k.add([
    k.sprite("player", { anim: "idleDown" }),
    k.pos(150 * MAP_SCALE, 200 * MAP_SCALE),
    k.scale(MAP_SCALE),
    k.area({ shape: new k.Rect(k.vec2(22, 25), 2, 2) }),
    k.body(),
    k.z(20),
    "player",
  ]);

  const music = k.play("bgm", {
    loop: true,   
    volume: 0.3,  
  });

  const collisionLayer = myMap.layers.find(
    (layer: any) => layer.name === "Collision",
  );
  if (collisionLayer && collisionLayer.objects) {
    collisionLayer.objects.forEach((obj: any) => {
      if (obj.polygon) {
        const points = obj.polygon.map((pt: any) =>
          k.vec2(pt.x * MAP_SCALE, pt.y * MAP_SCALE),
        );
        k.add([
          k.pos(obj.x * MAP_SCALE, obj.y * MAP_SCALE),
          k.area({ shape: new k.Polygon(points) }),
          k.body({ isStatic: true }),
          k.opacity(0),
          "wall",
        ]);
      } else if (obj.width && obj.height) {
        k.add([
          k.rect(obj.width * MAP_SCALE, obj.height * MAP_SCALE),
          k.pos(obj.x * MAP_SCALE, obj.y * MAP_SCALE),
          k.area(),
          k.body({ isStatic: true }),
          k.opacity(0),
          "wall",
        ]);
      }
    });
  }

  const chestLayer = myMap.layers.find((layer: any) => layer.name === "Chest");

  if (chestLayer && chestLayer.objects) {
    chestLayer.objects.forEach((obj: any) => {
      const pixelX = obj.x;
      const pixelY = obj.y;

      const chest = k.add([
        k.sprite("chest", { anim: "closed" }),
        k.pos(pixelX * MAP_SCALE, pixelY * MAP_SCALE),
        k.scale(MAP_SCALE),
        k.z(10),
        "chest",
      ]);

      k.add([
        k.rect(16 * MAP_SCALE, 16 * MAP_SCALE),
        k.pos((pixelX - -16) * MAP_SCALE, (pixelY - -16) * MAP_SCALE), 
        k.area(), 
        k.opacity(0),
        {
          parentChest: chest,
          poem: obj.properties?.find((p: any) => p.name === "poem")?.value || "A chest upon the grid is found,\nWhere pixel treasures do abound.\nTo give each chest a unique rhyme,\nUse an Object Layer next time!",
        },
        "chestTrigger",
      ]);
    });
  }

  const alertPop = k.add([
    k.text("!", { size: 24 }),
    k.pos(0, 0),
    k.color(255, 255, 0),
    k.z(100),
  ]);
  alertPop.hidden = true;

  const poemBox = k.add([
    k.rect(500, 240, { radius: 8 }),
    k.color(20, 20, 20),
    k.outline(4, k.rgb(255, 255, 255)),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.fixed(),
    k.z(200),
  ]);
  poemBox.hidden = true;

  const poemText = k.add([
    k.text("", { size: 18, width: 440, align: "center" }),
    k.pos(k.width() / 2, k.height() / 2),
    k.anchor("center"),
    k.fixed(),
    k.z(201),
  ]);
  poemText.hidden = true;

  let isNearChest = false;
  let isPoemOpen = false;
  let activeTrigger: any = null;

  player.onCollide("chestTrigger", (trigger) => {
    activeTrigger = trigger;
    isNearChest = true;
    alertPop.hidden = false;
    alertPop.pos = k.vec2(
      trigger.pos.x + 5 * MAP_SCALE,
      trigger.pos.y - 12 * MAP_SCALE,
    );
  });

  player.onCollideEnd("chestTrigger", () => {
    if (activeTrigger) activeTrigger.parentChest.play("closed");
    activeTrigger = null;
    isNearChest = false;
    alertPop.hidden = true;
    isPoemOpen = false;
    poemBox.hidden = true;
    poemText.hidden = true;
  });

  function togglePoem() {
    if (!isNearChest || !activeTrigger) return;

    isPoemOpen = !isPoemOpen;
    poemBox.hidden = !isPoemOpen;
    poemText.hidden = !isPoemOpen;

    if (isPoemOpen) {
      poemText.text = activeTrigger.poem;
      activeTrigger.parentChest.play("open");
      alertPop.hidden = true;
    } else {
      activeTrigger.parentChest.play("closed");
      alertPop.hidden = false;
    }
  }

  k.onKeyPress("enter", togglePoem);

  const joyCenter = k.vec2(80, k.height() - 80);
  const joyRadius = 40;
  let isDragging = false;
  let joystickDir = k.vec2(0, 0);

  const joyBase = k.add([
    k.circle(joyRadius),
    k.color(255, 255, 255),
    k.opacity(0.3),
    k.pos(joyCenter),
    k.fixed(),
    k.z(100),
  ]);
  const joyStick = k.add([
    k.circle(20),
    k.color(255, 255, 255),
    k.opacity(0.6),
    k.pos(joyCenter),
    k.fixed(),
    k.z(101),
  ]);

  // --- THE FOOLPROOF MATH CLICK LOGIC ---
  k.onMousePress(() => {
    // 1. If poem is open, tap anywhere to close it
    if (isPoemOpen) {
      togglePoem();
      return; 
    }

    // 2. If clicking on the joystick area, start dragging
    if (k.mousePos().dist(joyCenter) < joyRadius * 1.5) {
      isDragging = true;
      return;
    }

    // 3. Math-based chest clicking! 
    // If the player is near a chest, check if their tap was near the chest box
    if (isNearChest && activeTrigger) {
      // Find the center of the chest trigger box
      const triggerCenter = k.vec2(
        activeTrigger.pos.x + (16 * MAP_SCALE) / 2,
        activeTrigger.pos.y + (16 * MAP_SCALE) / 2
      );

      // If the mouse tap is within 80 pixels of the chest center, open it!
      if (k.mousePos().dist(triggerCenter) < 80) {
        togglePoem();
      }
    }
  });

  k.onMouseMove(() => {
    if (isDragging) {
      const mousePos = k.mousePos();
      const direction = mousePos.sub(joyCenter).unit();
      joyStick.pos = joyCenter.add(
        direction.scale(Math.min(mousePos.dist(joyCenter), joyRadius)),
      );
      joystickDir = direction;
    }
  });

  k.onMouseRelease(() => {
    isDragging = false;
    joyStick.pos = joyCenter;
    joystickDir = k.vec2(0, 0);
  });

  const SPEED = 120;
  let currentAnim = "idleDown";

  player.onUpdate(() => {
    if (isPoemOpen) return;

    let moveDir = k.vec2(0, 0);
    if (k.isKeyDown("left") || k.isKeyDown("a")) moveDir.x = -1;
    if (k.isKeyDown("right") || k.isKeyDown("d")) moveDir.x = 1;
    if (k.isKeyDown("up") || k.isKeyDown("w")) moveDir.y = -1;
    if (k.isKeyDown("down") || k.isKeyDown("s")) moveDir.y = 1;
    if (isDragging) moveDir = joystickDir;

    if (moveDir.x === 0 && moveDir.y === 0) {
      if (!currentAnim.startsWith("idle")) {
        const idleAnim = currentAnim.replace("walk", "idle");
        player.play(idleAnim);
        currentAnim = idleAnim;
      }
      return;
    }

    const moveVector = moveDir.unit();
    player.move(moveVector.scale(SPEED));

    let newAnim =
      Math.abs(moveVector.x) > Math.abs(moveVector.y)
        ? moveVector.x > 0
          ? "walkRight"
          : "walkLeft"
        : moveVector.y > 0
          ? "walkDown"
          : "walkUp";

    if (newAnim !== currentAnim) {
      player.play(newAnim);
      currentAnim = newAnim;
    }
  });
});

k.go("start");