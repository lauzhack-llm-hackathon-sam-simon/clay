"use client"

import { css } from '../../styled-system/css';
import PixiCanvas from './pixi-canvas';

//import { Splitter } from '~/components/ui/splitter'

export default function Home() {
  return (
    <div>
      <h1>Graph Viewer</h1>
      <PixiCanvas />
    </div>
  )
}
