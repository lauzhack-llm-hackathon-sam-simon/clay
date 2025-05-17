"use client";

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

const PixiCanvas = () => {
  const pixiContainerRef = useRef(null);

  useEffect(() => {

    const randomArray = (length) => {
      const arr = [];
      for (let i = 0; i < length; i++) {
        arr.push({
          weight: Math.floor(Math.random() * 255),
          category: Math.floor(Math.random() * 5) + 1,
        });
      }
      return arr;
    }

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

      const data = randomArray(30);
      // Load the bunny texture.
      const texture = await PIXI.Assets.load("http://localhost:62208/0_day.exe.jpg");

      // Define center
      const centerX = app.screen.width / 2;
      const centerY = app.screen.height / 2;

      // Category angle base
      const categoryAngleMap = new Map();
      const categoryCount = 5;
      for (let i = 1; i <= categoryCount; i++) {
        categoryAngleMap.set(i, (2 * Math.PI / categoryCount) * (i - 1));
      }

      for (const item of data) {
        const radius = 10 + item.weight / 5; // bigger weight = bigger circle
        const distanceFromCenter = 200 - (item.weight / 2); // more important = closer to center
        const angle = categoryAngleMap.get(item.category) + Math.random() * (Math.PI / categoryCount / 2); // slight randomness

        const x = centerX + distanceFromCenter * Math.cos(angle);
        const y = centerY + distanceFromCenter * Math.sin(angle);

        const circle = new PIXI.Graphics()
          .circle(0, 0, radius)
          .fill(texture);

        circle.x = x;
        circle.y = y;

        viewport.addChild(circle);
      }
    }
    loadPixi();
  }, []);

  return <div ref={pixiContainerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default PixiCanvas;
