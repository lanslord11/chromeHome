import React from "react";
import WebApps from "./components/webApps";
import BookMarks from "./components/bookMarks/BookMarks";
import Notes from "./components/notes/Notes";
import Contests from "./components/contests/Contests";

function App() {
  return (
    <>
      <div className="h-screen bg-[#050816] text-[#8892b0] p-6 overflow-hidden bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center bg-no-repeat">
        <div className="grid grid-cols-3 gap-6 h-full min-h-0" style={{ gridTemplateRows: "auto 1fr 1fr 1fr" }}>
          <div className="col-span-2 min-h-0 bg-[#0a192f] rounded-xl p-3 backdrop-blur-md border border-[#64ffda] shadow-lg shadow-[#64ffda]/20 transition-all duration-300 hover:shadow-[#64ffda]/40">
            <WebApps />
          </div>

          <div className="row-span-4 min-h-0 bg-[#0a192f] rounded-xl p-4 backdrop-blur-md border border-[#bd93f9] shadow-lg shadow-[#bd93f9]/20 transition-all duration-300 hover:shadow-[#bd93f9]/40 flex flex-col">
            <BookMarks />
          </div>

          <div className="col-span-2 row-span-4 min-h-0 flex flex-col h-full bg-[#0a192f] rounded-xl p-4 backdrop-blur-md border border-[#50fa7b] shadow-lg shadow-[#50fa7b]/20 transition-all duration-300 hover:shadow-[#50fa7b]/40">
            <Notes />
          </div>

          <div className="col-span-1 row-span-1 min-h-0 bg-[#0a192f] rounded-xl p-4 backdrop-blur-md border border-[#ffb86c] shadow-lg shadow-[#ffb86c]/20 transition-all duration-300 hover:shadow-[#ffb86c]/40">
            <Contests />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;