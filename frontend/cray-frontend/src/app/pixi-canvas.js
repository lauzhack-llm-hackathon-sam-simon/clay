"use client";

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';

let viewport;
let youCircle;
const placedPositions = [];
const circleObjects = [];

const PixiCanvas = ({ profiles, askForProfileDetails }) => {
  const pixiContainerRef = useRef(null);
  const pixiReadyRef = useRef(false);

  const [loadedUsernames, setLoadedUsernames] = useState([]);
  const profilesRef = useRef([]);

  const createNewConnection = async (element) => {
    if (loadedUsernames.includes(element.username)) {
      console.warn('Already loaded this username:', element.username);
      return;
    }
    setLoadedUsernames(prev => [...prev, element.username]);

    const texture = await PIXI.Assets.load(`http://localhost:3333/${element.username}.jpg`)

    const radius = 300;
    const centerX = viewport.worldWidth / 2;
    const centerY = viewport.worldHeight / 2;
    const angle = ((loadedUsernames.length + 5) * (360 / 10)) * (Math.PI / 180);

    const distance = 200 + Math.random() * 200;
    const rotationSpeed = (Math.random() < 0.5 ? -1 : 1) * (0.0005 + Math.random() * 0.001);

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    const circle = new PIXI.Graphics()
      .circle(0, 0, radius)
      .fill(texture)
    circle.x = x; circle.y = y;
    circle.scale.set(0.1);

    circle.initialAngle = angle;
    circle.rotationSpeed = rotationSpeed;
    circle.distance = distance;

    circle.eventMode = 'static';
    circle.cursor = 'pointer';

    circle.on('pointerdown', () => {
      console.log('Circle clicked:', element.username);
      console.log('Asking for profile details calling:', profilesRef.current);
      askForProfileDetails(element.username, profilesRef.current);
    });

    const connection = new PIXI.Graphics()
      .moveTo(youCircle.x, youCircle.y)
      .lineTo(circle.x, circle.y)
      .stroke({
        color: 0x237cff,
        width: 1.5,
      });

    viewport.addChild(connection);
    viewport.addChild(circle);
    viewport.setChildIndex(connection, 0);

    circleObjects.push({ circle, connection });
    placedPositions.push({ x, y, radius });
  };

  const updateAnimation = () => {
    if (!viewport) return;

    const centerX = viewport.worldWidth / 2;
    const centerY = viewport.worldHeight / 2;

    circleObjects.forEach(({ circle, connection }) => {
      circle.initialAngle += circle.rotationSpeed;

      circle.x = centerX + Math.cos(circle.initialAngle) * circle.distance;
      circle.y = centerY + Math.sin(circle.initialAngle) * circle.distance;

      connection.clear();
      connection
        .moveTo(youCircle.x, youCircle.y)
        .lineTo(circle.x, circle.y)
        .stroke({ color: 0x237cff, width: 1.5 });
    });

    requestAnimationFrame(updateAnimation);
  };

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
    async function loadPixi() {
      const app = new PIXI.Application();

      await app.init({
        resizeTo: pixiContainerRef.current,
        backgroundColor: 0xf1efed,
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
      app.stage.addChild(viewport);
      viewport.drag().pinch().wheel();

      const youTexture = await PIXI.Assets.load("http://localhost:3333/smn_lfrt.jpg");

      const centerX = viewport.worldWidth / 2;
      const centerY = viewport.worldHeight / 2;

      youCircle = PIXI.Sprite.from(youTexture);
      youCircle.width = 100;
      youCircle.height = 100;
      youCircle.anchor.set(0.5); // 중심 정렬
      youCircle.x = centerX;
      youCircle.y = centerY;

      const circleMask = new PIXI.Graphics()
      .circle(0, 0, 50)  // 반지름은 Sprite 크기 절반
      .fill(0xffffff)
      circleMask.x = youCircle.x;
      circleMask.y = youCircle.y;

      // 3. 마스크 적용
      youCircle.mask = circleMask;

      // 4. 둘 다 씬에 추가
      viewport.addChild(circleMask);
      viewport.addChild(youCircle);

      viewport.addChild(youCircle);
      placedPositions.push({ x: youCircle.x, y: youCircle.y, radius: 50 });

      pixiReadyRef.current = true;
      // setLoadedUsernames([]);
      createConnectionsIfReady(); 
      updateAnimation();
    }
    loadPixi();
  }, []);

  return <div ref={pixiContainerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default PixiCanvas;
