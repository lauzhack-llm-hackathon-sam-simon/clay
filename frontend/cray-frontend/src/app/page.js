"use client";

import Image from "next/image";
import { Splitter, SplitterPanel } from "primereact/splitter";
import PixiCanvas from "./pixi-canvas";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useEffect, useState, useRef } from "react";

export default function Home() {

  const [profiles, setProfiles] = useState([]);
  const [queryContent, setQueryContent] = useState("");
  const [messages, setMessages] = useState([]);

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length == 0) {
      const initialMessages = [
        {
          sender: "CLAY",
          text: "Hey there! I'm CLAY, your personal chats and network analyst 🤖\n\nI have analyzed your messages, photos and voice messages.",
        }
      ];
      setMessages(initialMessages);
    }

    const fetchProfiles = async () => {
      try {
        const response = await fetch('http://localhost:4000/initial');
        const data = await response.json();
        console.log('Fetched profiles:', data.data);
        setProfiles(prev => [...prev, ...data.data]);
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
      setMessages(messages => [...messages, { sender: "CLAY", text: data.response, metadata: data.metadata }]);
    } catch (error) {
      console.error('Error querying:', error);
    }
  };

  const askForProfileDetails = async (username, newProfiles) => {
    console.log('Asking for profile details:', newProfiles);
    const profile = newProfiles.find(p => p.username === username);
    console.log('Found profile:', profile);
    setMessages(messages => [...messages, {
      sender: "CLAY",
      text: (
        <div>
          Sure, here is more information about <b>{profile.username}</b>!
          <br />
          Notable memories and moments together:
          <div className="flex flex-col space-y-2 mt-2">
            <ul className="list-disc pl-5">
              {profile.profile.notableMemories.map((item, index) => (
                <li key={index} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ),
      metadata: null
    }]);
  };

  return (
    <div className="h-screen overflow-hidden">
      <Splitter style={{ height: '100%' }}>
        <SplitterPanel className="flex align-items-center justify-content-center" size={70}>
          <PixiCanvas profiles={profiles} askForProfileDetails={askForProfileDetails} />
        </SplitterPanel>
        <SplitterPanel className="flex flex-col p-3" size={30}>
          <div className="flex flex-col space-y-3 flex-1 overflow-y-auto pr-1">
            {messages.map((message, index) => {
              const isYou = message.sender === "You";
              return (
                <div
                  key={index}
                  className={`flex ${isYou ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[80%] px-4 py-2 rounded-2xl text-sm whitespace-pre-line
                      ${isYou
                        ? "bg-[#237cff] text-white rounded-br-none"
                        : "bg-blue-100 text-black rounded-bl-none"}
                    `}
                  >
                    {message.metadata && (
                      <div className="text-xs text-gray-500 mb-1">
                        {message.metadata}
                      </div>
                    )}
                    {message.text}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="pt-3">
            <div className="p-inputgroup w-full">
              <InputText
                placeholder="Talk to CLAY..."
                className="w-full"
                value={queryContent}
                onChange={(e) => setQueryContent(e.target.value)}
              />
              <Button
                icon="pi pi-send"
                className="p-button w-auto"
                onClick={() => {
                  setMessages(messages => [...messages, { sender: "You", text: queryContent, metadata: null }]);
                  query(queryContent);
                  setQueryContent("");
                }}
              />
            </div>
          </div>
        </SplitterPanel>
      </Splitter>
    </div>
  );
}
