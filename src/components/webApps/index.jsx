import React from "react";
import {Linkedin,Github, Globe,Twitter,Youtube,Music , Mail , ShoppingCart,Search,MessageCircle,Twitch } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import ChatGPTIcon from "./ChatGPTIcon";
import ClaudeAIIcon from "./ClaudeAIIcon";
import SpotifyIcon from "./SpotifyIcon";
import AmazonIcon from "./AmazonIcon";
import LeetCodeIcon from './LeetCodeIcon'; 
import CodeforcesIcon from './CodeforcesIcon'; 

SpotifyIcon
const webApps = [
  {
    name: "GitHub",
    icon: Github,
    color: "#f34f29",
    url: "https://github.com",
  },
  {
    name: "Twitter",
    icon: Twitter,
    color: "#1DA1F2",
    url: "https://twitter.com",
  },
  {
    name: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    url: "https://youtube.com",
  },
  { name: "Twitch", icon: Twitch, color: "#6441A4", url: "https://twitch.tv" },
  {
    name: "Spotify",
    icon: SpotifyIcon,
    color: "#1DB954",
    url: "https://spotify.com",
  },
  {
    name: "Gmail",
    icon: Mail,
    color: "#D44638",
    url: "https://mail.google.com",
  },
  {
    name: "Amazon",
    icon: AmazonIcon,
    color: "#FF9900",
    url: "https://amazon.com",
  },
  { name: "Google", icon: Search, color: "#4285F4", url: "https://google.com" },
  {
    name: "Whatsapp",
    icon: MessageCircle,
    color: "#1877F2",
    url: "https://web.whatsapp.com",
  },
  {
    name: "ChatGPT",
    icon: ChatGPTIcon, // Use the ChatGPTIcon component
    color: "#00A67E",
    url: "https://chat.openai.com",
  },
  {
    name: "Claude AI",
    icon: ClaudeAIIcon, // Use the ClaudeAIIcon component
    color: "#FF9900",
    url: "https://claude.ai",
  },
  {
    name: "LinkedIn",
    icon: Linkedin, // Use the ClaudeAIIcon component
    color: "#1DA1F2",
    url: "https://linkedin.com",
  },
  {
    name: "LeetCode",
    icon: LeetCodeIcon, // Use the LeetCodeIcon component
    color: "#FFA116",
    url: "https://leetcode.com",
  },
  {
    name: "Codeforces",
    icon: CodeforcesIcon, // Use the CodeforcesIcon component
    color: "#1F8ACB",
    url: "https://codeforces.com",
  },
];


const WebApps = () => {
  const controls = useAnimation();
  const [hoveredApp, setHoveredApp] = useState(null);

  useEffect(() => {
    controls.start((i) => ({
      y: [0, -5, 0],
      transition: {
        delay: i * 0.2,
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
      },
    }));
  }, [controls]);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" style={{ color: "#64ffda" }} />
          <h2 className="text-sm font-bold" style={{ color: "#ccd6f6" }}>
            Web Apps
          </h2>
        </div>
        <div className="text-xs font-bold" style={{ color: "#64ffda" }}>
          SD 2023.181
        </div>
      </div>
      <motion.div
        className="flex flex-wrap justify-center gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {webApps.map((app, index) => (
          <a href={app.url}>
            <motion.div
              key={app.name}
              className="relative"
              onMouseEnter={() => setHoveredApp(app.name)}
              onMouseLeave={() => setHoveredApp(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              custom={index}
              animate={controls}
            >
              <motion.button
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: app.color }}
                whileHover={{ boxShadow: `0 0 8px ${app.color}` }}
              >
                <app.icon className="w-4 h-4" style={{ color: "white" }} />
              </motion.button>
              {hoveredApp === app.name && (
                <motion.div
                  className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-[#1d3a6e] text-[#ccd6f6] px-2 py-1 rounded-md text-xs whitespace-nowrap"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {app.name}
                </motion.div>
              )}
            </motion.div>
          </a>
        ))}
      </motion.div>
    </>
  );
};

export default WebApps;
