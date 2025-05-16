"use client";

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

const PixiCanvas = () => {
  const pixiContainerRef = useRef(null);

  useEffect(() => {
    async function loadPixi() {
      const app = new PIXI.Application();

      await app.init({
        resizeTo: window,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xFFFFFF,
      });

      pixiContainerRef.current.appendChild(app.canvas);

      // Load the bunny texture.
      const texture = await PIXI.Assets.load('https://pixijs.com/assets/bunny.png');

      // Create a new Sprite from an image path
      const bunny = new PIXI.Sprite(texture);

      // Add to stage
      app.stage.addChild(bunny);

      // Center the sprite's anchor point
      bunny.anchor.set(0.5);

      // Move the sprite to the center of the screen
      bunny.x = app.screen.width / 2;
      bunny.y = app.screen.height / 2;
    }
    loadPixi();
  }, []);

  return <div ref={pixiContainerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default PixiCanvas;
