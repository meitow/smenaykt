"use client";

import { useState } from "react";
import { TASK_EMOJI_PRESETS, isSingleEmoji, sanitizeEmoji } from "@/lib/emoji";
import { t } from "@/lib/i18n";

type EmojiPickerProps = {
  value: string;
  onChange: (emoji: string) => void;
};

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState("");

  function pickCustom(raw: string) {
    setCustom(raw);
    setCustomError("");
    if (!raw) return;
    if (isSingleEmoji(raw)) {
      onChange(sanitizeEmoji(raw));
      return;
    }
    if ([...raw].length > 1) setCustomError(t("post.emojiOneOnly"));
  }

  return (
    <fieldset>
      <legend className="text-[15px] font-medium text-muted">{t("post.pickEmoji")}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {TASK_EMOJI_PRESETS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setCustom("");
              setCustomError("");
              onChange(option);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
              value === option ? "bg-ink text-white" : "bg-page text-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[15px] font-medium text-muted">{t("post.customEmoji")}</p>
        <input
          value={custom}
          onChange={(e) => pickCustom(e.target.value)}
          placeholder="😀"
          maxLength={8}
          className="input-field mt-3 w-[4.5rem] text-center text-xl"
        />
        {customError && <p className="mt-2 text-[15px] text-rose-600">{customError}</p>}
      </div>
    </fieldset>
  );
}
