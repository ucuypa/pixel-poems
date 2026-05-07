// @ts-ignore: Ignore React type resolution in this environment
import React, { useEffect, useRef } from 'react';
import kaboom from 'kaboom';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Initialize Kaboom
    const k = kaboom({
      canvas: canvasRef.current,
      width: 800,       
      height: 400,      
      scale: 2,         
      background: [155, 226, 136], // This acts as our base grass color!
    });

    // 2. Define the Game Scene
    k.scene("main", () => {
      
      // The Map Array (Draw your world here!)
      const mapLayout = [
        "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
        "~~~~~        T             ~~~~~~",
        "~~~~            T           ~~~~~",
        "~~~~    ^^^^          |---|   ~~~",
        "~~~~  T ####          |   |   ~~~",
        "~~~~    ####                  ~~~",
        "~~~~             T      T     ~~~",
        "~~~~~ == ~~~~~~~~~~~~~~~~ == ~~~~",
        "~~~~~ ~~ ~~~~~~~~~~~~~~~~ ~~ ~~~~",
        "~~~~~    ~~~~        ~~~~    ~~~~",
        "~~~~~ T  ~~~~    T   ~~~~ T  ~~~~",
        "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
      ];

      // 3. Tell Kaboom how to read the Map Array
      const levelConfig = {
        tileWidth: 16,
        tileHeight: 16,
        tiles: {
          // Water (Blue block + Solid Collision)
          "~": () => [
            k.rect(16, 16), 
            k.color(60, 150, 255), 
            k.area(), 
            k.body({ isStatic: true })
          ],
          // Trees (Dark Green block + Solid Collision)
          "T": () => [
            k.rect(16, 16), 
            k.color(34, 139, 34), 
            k.area(), 
            k.body({ isStatic: true })
          ],
          // House Roof (Red block + Solid Collision)
          "^": () => [
            k.rect(16, 16), 
            k.color(200, 50, 50), 
            k.area(), 
            k.body({ isStatic: true })
          ],
          // House Walls (Brown block + Solid Collision)
          "#": () => [
            k.rect(16, 16), 
            k.color(139, 69, 19), 
            k.area(), 
            k.body({ isStatic: true })
          ],
          // Fences (Light Brown block + Solid Collision)
          "|": () => [k.rect(4, 16), k.color(210, 180, 140), k.area(), k.body({ isStatic: true })],
          "-": () => [k.rect(16, 4), k.color(210, 180, 140), k.area(), k.body({ isStatic: true })],
          // Bridges (Wood color block, Walkable!)
          "=": () => [
            k.rect(16, 16), 
            k.color(160, 82, 45)
          ],
        }
      };

      // 4. Render the level
      k.addLevel(mapLayout, levelConfig);

    });

    // 5. Start the engine
    k.go("main");

  }, []); 

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#222' }}>
      <canvas ref={canvasRef} style={{ border: '4px solid #fff', borderRadius: '8px' }}></canvas>
    </div>
  );
}