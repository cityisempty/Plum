import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  boxed?: boolean;
};

export function DigitInput({ value, onChange, boxed }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = (value + "      ").slice(0, 6).split("");

  useEffect(() => {
    if (!value) refs.current[0]?.focus();
  }, [value]);

  function setAt(i: number, ch: string) {
    const next = digits.map((d, idx) => (idx === i ? ch : d === " " ? "" : d));
    onChange(next.join("").replace(/\D/g, "").slice(0, 6));
  }

  return (
    <div className={"digits" + (boxed ? " is-boxed" : "")} role="group" aria-label="六位数字">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={d === " " ? "" : d}
          aria-label={`第 ${i + 1} 位`}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, ch);
            if (ch && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (text) {
              e.preventDefault();
              onChange(text);
            }
          }}
        />
      ))}
    </div>
  );
}
