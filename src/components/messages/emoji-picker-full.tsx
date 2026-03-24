"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";

const CATEGORIES = [
  { name: "Smileys", icon: "😀", emojis: ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","😐","😑","😶","😏","😒","🙄","😬","😮‍💨","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😤","😡","🤬","👍","👎","👊","✊","🤛","🤜","👏","🙌","👋","🤚","🖐️","✋","🤞","🤟","🤘","🤙","👌","🤌","🫡"] },
  { name: "Animals", icon: "🐶", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦅","🦆","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🌺","🌻","🌷","🌹","🌼","🌾","🌲","🌳","🌴","🌵"] },
  { name: "Food", icon: "🍔", emojis: ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍑","🍒","🍅","🥑","🍆","🥕","🌽","🌶️","🥒","🥦","🍔","🍕","🌮","🌯","🥙","🥚","🍳","🥘","🍲","🥗","🍿","🍰","🎂","🍪","🍩","🍧","🍦","🍨","☕","🍵","🧃"] },
  { name: "Activities", icon: "⚽", emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥍","🏑","⛳","🏹","🎣","🥊","🥋","🏆","🥇","🥈","🥉","🎯","🎮","🎲","🧩","🎭","🎨"] },
  { name: "Travel", icon: "✈️", emojis: ["🚗","🚕","🚌","🚎","🚑","🚒","🚓","🚙","🚲","✈️","🚀","🛸","🚢","⛵","🌍","🌎","🌏","🏔️","🌋","🏕️","🏖️","🏠","🏢","🏣","🏨","🏩","⛪","🗼","🗽","🎡"] },
  { name: "Objects", icon: "💡", emojis: ["⌚","📱","💻","⌨️","💽","💿","📀","🎥","📷","📸","📹","📺","📻","📞","📧","📮","📨","📩","📦","📝","📁","📂","📋","📊","📈","📉","🔍","🔎","💡","🔧"] },
  { name: "Symbols", icon: "❤️", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","⭐","🌟","✨","💫","🔥","✔️","❌","❓","❗","💢","💯","🚫","♻️","⚠️","🔴","🟢","🔵","⚪","⚫"] },
];

export function EmojiPickerFull({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");

  return (
    <div className="absolute bottom-full right-0 mb-2 w-[340px] bg-white rounded-xl shadow-xl border border-[#e0e0e0] z-50 flex flex-col max-h-[320px]">
      <div className="px-3 pt-3 pb-2 border-b border-[#e0e0e0] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#1d1c1d]">Emoji</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#f8f8f8] text-[#616061]"><X size={14} /></button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#616061]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search emoji" className="w-full pl-8 pr-3 py-1.5 border border-[#e0e0e0] rounded-md text-sm focus:outline-none focus:border-[#007a5a]" />
        </div>
      </div>
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-[#e0e0e0] shrink-0">
        {CATEGORIES.map((cat, idx) => (
          <button key={cat.name} onClick={() => setActiveCategory(idx)} title={cat.name} className={`w-8 h-8 flex items-center justify-center rounded text-lg shrink-0 ${activeCategory === idx ? "bg-[#f0f0f0]" : "hover:bg-[#f8f8f8]"}`}>
            {cat.icon}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="text-xs font-medium text-[#616061] mb-1.5">{CATEGORIES[activeCategory]?.name}</div>
        <div className="grid grid-cols-8 gap-1">
          {CATEGORIES[activeCategory]?.emojis.filter((e) => !search || e.includes(search)).map((emoji, idx) => (
            <button key={`${emoji}-${idx}`} onClick={() => { onSelect(emoji); onClose(); }} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-xl">{emoji}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
