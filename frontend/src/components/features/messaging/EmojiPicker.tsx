import { useState, useEffect, useRef } from "react";
import { Search, Clock } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "@/lib/i18n";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  recent: {
    label: "Recently Used",
    icon: "🕐",
    emojis: [] as string[], // Will be loaded from localStorage
  },
  smileys: {
    label: "Smileys & People",
    icon: "😊",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐"],
  },
  gestures: {
    label: "Gestures",
    icon: "👍",
    emojis: ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️", "🙏", "🦶", "🦵"],
  },
  medical: {
    label: "Medical",
    icon: "🏥",
    emojis: ["💊", "💉", "🩸", "🩹", "🩺", "🏥", "⚕️", "👨‍⚕️", "👩‍⚕️", "🧑‍⚕️", "🦷", "🧬", "🔬", "🧪"],
  },
  hearts: {
    label: "Hearts",
    icon: "❤️",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  },
  symbols: {
    label: "Symbols",
    icon: "✨",
    emojis: ["✨", "⭐", "🌟", "💫", "✅", "❌", "⚠️", "🔥", "💯", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉"],
  },
};

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent emojis from localStorage
    const stored = localStorage.getItem("recentEmojis");
    if (stored) {
      setRecentEmojis(JSON.parse(stored));
    }

    // Close on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);

    // Update recent emojis
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 24);
    setRecentEmojis(updated);
    localStorage.setItem("recentEmojis", JSON.stringify(updated));
  };

  const getFilteredEmojis = () => {
    if (searchQuery) {
      // Search across all categories
      return Object.values(EMOJI_CATEGORIES)
        .flatMap((cat) => cat.emojis)
        .filter((emoji) => emoji.includes(searchQuery));
    }

    if (selectedCategory === "recent") {
      return recentEmojis;
    }

    return EMOJI_CATEGORIES[selectedCategory].emojis;
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
    >
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('components.emoji_picker.search_emojis_placeholder_1', "Search emojis...")}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 overflow-x-auto">
          {recentEmojis.length > 0 && (
            <button
              onClick={() => setSelectedCategory("recent")}
              className={`p-2 rounded-lg transition-colors ${
                selectedCategory === "recent"
                  ? "bg-[#0D9488]/10 text-[#0D9488]"
                  : "hover:bg-gray-100"
              }`}
              title={t('components.emoji_picker.recently_used_title_2', "Recently Used")}
            >
              <Clock className="w-5 h-5" />
            </button>
          )}
          {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => {
            if (key === "recent") return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as keyof typeof EMOJI_CATEGORIES)}
                className={`p-2 text-xl rounded-lg transition-colors ${
                  selectedCategory === key
                    ? "bg-[#0D9488]/10"
                    : "hover:bg-gray-100"
                }`}
                title={cat.label}
              >
                {cat.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-3 h-64 overflow-y-auto">
        {filteredEmojis.length > 0 ? (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm">{t('components.emoji_picker.no_emojis_found', "No emojis found")}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {selectedCategory === "recent" && recentEmojis.length > 0
            ? "Recently used emojis"
            : EMOJI_CATEGORIES[selectedCategory]?.label || "Select an emoji"}
        </p>
      </div>
    </motion.div>
  );
}
