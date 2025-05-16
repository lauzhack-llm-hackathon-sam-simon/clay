"use client";

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

const PixiCanvas = () => {
  const pixiContainerRef = useRef(null);

  useEffect(() => {
    async function loadPixi() {
      const app = new PIXI.Application();

      await app.init({
        resizeTo: pixiContainerRef.current,
        backgroundColor: 0xFFFFFF,
      });

      pixiContainerRef.current.appendChild(app.canvas);

      const viewport = new Viewport({
          screenWidth: pixiContainerRef.current.offsetWidth,
          screenHeight: pixiContainerRef.current.offsetHeight,
          worldWidth: 1000,
          worldHeight: 1000,
          events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
      });

      // add the viewport to the stage
      app.stage.addChild(viewport);

      // activate plugins
      viewport.drag().pinch().wheel();

      // Load the bunny texture.
      const texture = await PIXI.Assets.load({
        src: "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250",
        loadParser: 'loadTextures'
      });

      // Create a new Sprite from an image path
      const bunny = new PIXI.Sprite(texture);

      const circle = new PIXI.Graphics()
      .circle(0, 0, 100)
      .fill(texture);

      viewport.addChild(circle);

      // Center the sprite's anchor point
      bunny.anchor.set(0.5);

      // Move the sprite to the center of the screen
      circle.x = app.screen.width / 2;
      circle.y = app.screen.height / 2;

    }
    loadPixi();
  }, []);

  return <div ref={pixiContainerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default PixiCanvas;
