import { useState } from "react";
import { Pressable, TextInput, View, type KeyboardTypeOptions, type TextInputProps } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { font, radius, useColors } from "@/theme";
import { Txt } from "./Txt";

interface FieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  suffix?: string;
}

/** ช่องกรอก — พื้น stone-50/stone-800 ขอบ stone-200, ขอบแดง + ข้อความเมื่อ error (แบบฟอร์มเว็บ) */
export function Field({ label, error, hint, required, secure, multiline, suffix, ...input }: FieldProps) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? c.danger : focused ? c.brand : c.borderStrong;

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Txt size={13.5} weight="medium" tone="muted">
          {label}
          {required && <Txt color={c.danger}> *</Txt>}
        </Txt>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          borderWidth: 1,
          borderColor,
          borderRadius: radius.md,
          backgroundColor: c.isDark ? c.surfaceAlt : c.surface,
          paddingHorizontal: 14,
          minHeight: multiline ? 96 : 48,
        }}
      >
        <TextInput
          placeholderTextColor={c.textFaint}
          {...input}
          secureTextEntry={secure && hidden}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={{
            flex: 1,
            fontFamily: font.regular,
            fontSize: 15.5,
            color: c.text,
            paddingVertical: multiline ? 12 : 10,
            textAlignVertical: multiline ? "top" : "center",
            // เว็บ (ใช้ทดสอบ) วาดกรอบ focus ของเบราว์เซอร์ซ้อน — กรอบสี brand ด้านนอกบอก focus แล้ว
            outlineWidth: 0,
          }}
        />
        {suffix && (
          <Txt size={14} tone="faint" style={{ marginLeft: 6 }}>
            {suffix}
          </Txt>
        )}
        {secure && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityLabel={hidden ? "แสดงรหัสผ่าน" : "ซ่อนรหัสผ่าน"}
          >
            {hidden ? <Eye size={20} color={c.textFaint} /> : <EyeOff size={20} color={c.textFaint} />}
          </Pressable>
        )}
      </View>
      {error ? (
        <Txt size={12.5} tone="danger">
          {error}
        </Txt>
      ) : hint ? (
        <Txt size={12.5} tone="faint">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}
