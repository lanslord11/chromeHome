import React from "react";
import WebApps from "./components/webApps";
import BookMarks from "./components/bookMarks/BookMarks";
import Hackathons from "./components/hackathons/Hackathons";
import DevNews from "./components/news/DevNews";
import Contests from "./components/contests/Contests";

function App() {
  return (
    <>
      <div className="h-screen bg-[#050816] text-[#8892b0] p-6 overflow-hidden bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center bg-no-repeat">
        <div className="grid grid-cols-3 grid-rows-3 gap-6 h-full">
          <div className="col-span-2 bg-[#0a192f] rounded-xl p-3 backdrop-blur-md border border-[#64ffda] shadow-lg shadow-[#64ffda]/20 transition-all duration-300 hover:shadow-[#64ffda]/40">
            <WebApps />
          </div>

          <div className="row-span-3 bg-[#0a192f] rounded-xl p-4 backdrop-blur-md border border-[#bd93f9] shadow-lg shadow-[#bd93f9]/20 transition-all duration-300 hover:shadow-[#bd93f9]/40 flex flex-col">
            <BookMarks />
          </div>

          <div className="col-span-2 row-span-2 h-full bg-[#0a192f] rounded-xl p-4 backdrop-blur-md border border-[#50fa7b] shadow-lg shadow-[#50fa7b]/20 transition-all duration-300 hover:shadow-[#50fa7b]/40">
            <Hackathons />
          </div>

          <div className="col-span-2 bg-[#0a192f] rounded-xl p-4 backdrop-blur-md border border-[#ff79c6] shadow-lg shadow-[#ff79c6]/20 transition-all duration-300 hover:shadow-[#ff79c6]/40">
            <DevNews />
          </div>

          <div className="col-span-1 row-span-1 bg-[#0a192f] rounded-xl p-4 backdrop-blur-md border border-[#ffb86c] shadow-lg shadow-[#ffb86c]/20 transition-all duration-300 hover:shadow-[#ffb86c]/40">
            <Contests />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;