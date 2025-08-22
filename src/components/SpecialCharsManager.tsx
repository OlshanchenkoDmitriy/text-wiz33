import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface SpecialCharsManagerProps {
  text: string;
  onTextChange: (newText: string) => void;
}

export const SpecialCharsManager = ({ text, onTextChange }: SpecialCharsManagerProps) => {
  // Multi-character token patterns treated as atomic (default: ****)
  const tokenPatterns = ["\\*\\*\\*\\*"]; // add more patterns if needed

  const tokenRegex = useMemo(() => {
    if (!tokenPatterns.length) return null as RegExp | null;
    const alternation = tokenPatterns.join("|");
    return new RegExp(alternation, "g");
  }, [text]);

  // Find all token matches and mark their ranges as busy
  const tokenMatches = useMemo(() => {
    const list: { text: string; start: number; end: number }[] = [];
    if (!tokenRegex) return list;
    let m: RegExpExecArray | null;
    while ((m = tokenRegex.exec(text)) !== null) {
      list.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    }
    return list;
  }, [text, tokenRegex]);

  const tokenCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tokenMatches) map.set(t.text, (map.get(t.text) ?? 0) + 1);
    return Array.from(map.entries()).map(([token, count]) => ({ token, count }));
  }, [tokenMatches]);

  const specialChars = useMemo(() => {
    const busy = new Array<boolean>(text.length).fill(false);
    for (const tm of tokenMatches) for (let i = tm.start; i < tm.end; i++) busy[i] = true;

    const charSet = new Set<string>();
    // Collect unique special single characters excluding those inside tokens
    for (let i = 0; i < text.length; i++) {
      if (busy[i]) continue;
      const char = text[i];
      if (!/[\p{L}\p{N}\s]/u.test(char)) {
        charSet.add(char);
      }
    }
    return Array.from(charSet).sort();
  }, [text, tokenMatches]);

  const removeChar = (charToRemove: string) => {
    const escaped = charToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove only characters not part of defined tokens by rebuilding string
    const re = new RegExp(escaped, 'g');
    if (!tokenRegex) {
      onTextChange(text.replace(re, ''));
      return;
    }
    // Build busy map to protect tokens
    const busy = new Array<boolean>(text.length).fill(false);
    for (const tm of tokenMatches) for (let i = tm.start; i < tm.end; i++) busy[i] = true;
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!busy[i] && re.test(ch)) {
        // skip single char removal
      } else {
        out += ch;
      }
      // reset lastIndex for single-char test
      re.lastIndex = 0;
    }
    onTextChange(out);
  };

  const removeToken = (token: string) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'g');
    onTextChange(text.replace(re, ''));
  };

  if (specialChars.length === 0 && tokenCounts.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
      {(tokenCounts.length > 0) && (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Последовательности:</span>
            <Badge variant="secondary" className="text-xs">{tokenCounts.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {tokenCounts.map(({ token, count }, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => removeToken(token)}
                className="h-7 px-2 font-mono text-xs hover:bg-destructive/20 hover:border-destructive/50"
                title={`Удалить все вхождения: ${count}`}
              >
                <span className="mr-1">{token}</span>
                <Badge variant="secondary" className="text-[10px] mr-1">×{count}</Badge>
                <X className="w-3 h-3" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {(specialChars.length > 0) && (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Найденные символы:</span>
            <Badge variant="secondary" className="text-xs">{specialChars.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {specialChars.map((char, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => removeChar(char)}
                className="h-7 px-2 font-mono text-xs hover:bg-destructive/20 hover:border-destructive/50"
              >
                <span className="mr-1">{char}</span>
                <X className="w-3 h-3" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};