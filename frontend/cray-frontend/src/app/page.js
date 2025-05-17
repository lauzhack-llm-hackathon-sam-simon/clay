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
  const [queryContent, setQueryContent] = useState("");
  const [messages, setMessages] = useState([]);


  useEffect(() => {

    if (messages.length == 0) {
      const initialMessages = [
        {
          sender: "Clay",
          text: "Hey there! I'm Clay, your personal chats and network analyst 🤖",
        }
      ];
      setMessages(initialMessages);
    }

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

  const query = async (text) => {
    try {
      const response = await fetch(`http://localhost:4000/query?text=${text}`);
      const data = await response.json();
      console.log('Query result:', data);
      const newProfiles = data.newProfiles;
      setProfiles(profiles => [...profiles, ...newProfiles]);
      setMessages(messages => [...messages, { sender: "Clay", text: data.response, metadata: data.metadata }]);
    } catch (error) {
      console.error('Error querying:', error);
    }
  }

  return (
    <div>
      <Splitter style={{ height: '100vh' }}>
          <SplitterPanel className="flex align-items-center justify-content-center" size={70}>
            <PixiCanvas profiles={profiles} />
          </SplitterPanel>
          <SplitterPanel className="flex flex-col justify-between p-3" size={30}>
            <div className="space-y-3 overflow-y-auto">
              {messages.map((message, index) => (
                <Card title={message.sender} key={index} className="w-full">
                  {message.metadata && (
                    <p className="text-sm text-gray-500 mb-2">
                      {message.metadata}
                    </p>
                  )}
                  <p className="m-0">{message.text}</p>
                </Card>
              ))}
            </div>
            <div className="pt-3">
              <div className="p-inputgroup w-full">
                <InputText placeholder="Talk to Clay..." className="w-full" value={queryContent} onChange={(e) => setQueryContent(e.target.value)} />
                <Button icon="pi pi-send" className="p-button-warning w-auto" onClick={() => {
                  setMessages(messages => [...messages, { sender: "You", text: queryContent, metadata: null }]);
                  query(queryContent);
                  setQueryContent("");
                }} />
              </div>
            </div>
          </SplitterPanel>
      </Splitter>
    </div>
  );
}
