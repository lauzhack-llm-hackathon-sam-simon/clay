"use client"

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // global css
import { Button } from "primereact/button";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {

  const [hasPressedGettingStarted, setHasPressedGettingStarted] = useState(false);
  const handleButtonClick = () => {
    setHasPressedGettingStarted(true);
    // Logic to handle button click
  }
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* {!hasPressedGettingStarted && (
           <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-4xl font-bold">Clay</h1>
            <h2 className="text-xl">Chats and Relationships Analyzer (for You :) - Powered by Together.ai</h2>
            <Button label="Get Started" className="mt-4" onClick={handleButtonClick} />
          </div>
        )} */}
        {children}
      </body>
    </html>
  );
}
