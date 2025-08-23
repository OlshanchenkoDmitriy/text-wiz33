import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toolbar, EditorMode } from "./editor/Toolbar";
import { FormattingPanel } from "./editor/FormattingPanel";
import { ListTools } from "./editor/ListTools";
import { MacroManager } from "./editor/MacroManager";

export const Editor = () => {
  const [text, setText] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editorMode, setEditorMode] = useState<EditorMode>("simple");

  const addToHistory = (newText: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (newText !== history[historyIndex]) {
      addToHistory(newText);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setText(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setText(history[historyIndex + 1]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Редактор</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Toolbar
          text={text}
          onTextChange={handleTextChange}
          editorMode={editorMode}
          setEditorMode={setEditorMode}
          undo={undo}
          redo={redo}
        />
        <FormattingPanel text={text} onTextChange={handleTextChange} />
        <ListTools text={text} onTextChange={handleTextChange} />
        <MacroManager text={text} onTextChange={handleTextChange} />
        <Textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[300px]"
        />
      </CardContent>
    </Card>
  );
};

