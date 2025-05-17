"use client";

import Image from "next/image";
import { Splitter, SplitterPanel } from "primereact/splitter";
import PixiCanvas from "./pixi-canvas";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useEffect, useState } from "react";

export default function Home() {

  const [profiles, setProfiles] = useState([]);

  useEffect(() => {

    const fetchProfiles = async () => {
      try {
        const response = await fetch('http://localhost:4000/initial');
        const data = await response.json();
        console.log('Fetched profiles:', data.data);
        setProfiles(data.data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      }
    };

    fetchProfiles();

  }, []);

  return (
    <div>
      <Splitter style={{ height: '100vh' }}>
          <SplitterPanel className="flex align-items-center justify-content-center" size={70}>
            <PixiCanvas profiles={profiles} />
          </SplitterPanel>
          <SplitterPanel className="flex flex-col justify-between p-3" size={30}>
            <div className="space-y-3 overflow-y-auto">
              <Card title="Clay">
                <p className="m-0">Hey there! I'm Clay, your personal relationship analyst 🤖</p>
              </Card>
              <Card title="You">
                <p className="m-0">Hi Clay, can you tell me how often I talk to Alice?</p>
              </Card>
              <Card title="Clay">
                <p className="m-0">Sure! You exchanged 72 messages last week, mostly on Wednesday 📊</p>
              </Card>
            </div>
            <div className="pt-3">
              <div className="p-inputgroup w-full">
                <InputText placeholder="Talk to Clay..." className="w-full" />
                <Button icon="pi pi-send" className="p-button-warning w-auto" />
              </div>
            </div>
          </SplitterPanel>
      </Splitter>
    </div>
  );
}
