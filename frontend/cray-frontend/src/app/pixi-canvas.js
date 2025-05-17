"use client";

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

let viewport;
let youCircle;
const placedPositions = [];

const PixiCanvas = ({ profiles }) => {
  const pixiContainerRef = useRef(null);
  const pixiReadyRef = useRef(false);

  const [loadedUsernames, setLoadedUsernames] = useState([]);

  const createNewConnection = async (element) => {

    if (loadedUsernames.includes(element.username)) {
      console.warn('Already loaded this username:', element.username);
      return;
    }
    setLoadedUsernames(prev => [...prev, element.username]);

    const texture = await PIXI.Assets.load(`http://localhost:3333/${element.username}.jpg`)

    const radius = 300;
    let x, y, tries = 0, overlaps;
    const maxTries = 100;
    do {
      x = Math.random() * viewport.worldWidth;
      y = Math.random() * viewport.worldHeight;
      // overlaps = placedPositions.some(p => {
      //   const dx = x - p.x;
      //   const dy = y - p.y;
      //   // only consider overlapping when the two circles actually intersect
      //   return Math.hypot(dx, dy) < radius + p.radius;
      // });
      // tries++;
    } while (overlaps && tries < maxTries);

    if (tries === maxTries) {
      console.warn('Could not place circle without overlap after', maxTries, 'tries');
    }

    // draw new circle
    const circle = new PIXI.Graphics()
      .circle(0, 0, radius)
      .fill(texture)
    circle.x = x; circle.y = y;
    circle.scale.set(0.1);

    const connection = new PIXI.Graphics()
      .moveTo(youCircle.x, youCircle.y)
      .lineTo(circle.x, circle.y)
      .stroke({
        color: 0x000000,
        width: 2,
      });

    viewport.addChild(connection);
    viewport.addChild(circle);
    viewport.setChildIndex(connection, 0);

    placedPositions.push({ x, y, radius });

  };

  const profilesRef = useRef([]);

  useEffect(() => {
    profilesRef.current = profiles;
    createConnectionsIfReady();
  }, [profiles]);

  const createConnectionsIfReady = () => {
    const currentProfiles = profilesRef.current;
    if (!pixiReadyRef.current || !currentProfiles || currentProfiles.length === 0) return;
    console.log("Creating connections if ready (ref):", currentProfiles);
    currentProfiles.forEach(profile => createNewConnection(profile));
  };

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

      const viewportContainer = new Viewport({
        screenWidth: pixiContainerRef.current.offsetWidth,
        screenHeight: pixiContainerRef.current.offsetHeight,
        worldWidth: 1000,
        worldHeight: 1000,
        events: app.renderer.events, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
      });

      viewport = viewportContainer;

      // add the viewport to the stage
      app.stage.addChild(viewport);

      // activate plugins
      viewport.drag().pinch().wheel();

      const youTexture = await PIXI.Assets.load("http://localhost:3333/smn_lfrt.jpg");

      // Define center
      const centerX = app.screen.width / 2;
      const centerY = app.screen.height / 2;

      youCircle = new PIXI.Graphics()
        .circle(0, 0, 50)
        .fill(youTexture);
      youCircle.x = centerX;
      youCircle.y = centerY;

      viewport.addChild(youCircle);

      placedPositions.push({ x: youCircle.x, y: youCircle.y, radius: 50 });

      profiles.forEach((profile) => {
        createNewConnection(profile);
      });

      pixiReadyRef.current = true;
      setLoadedUsernames([]);
      createConnectionsIfReady(); 
    }
    loadPixi();
  }, []);

  return <div ref={pixiContainerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default PixiCanvas;
