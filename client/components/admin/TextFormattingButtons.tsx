import React from 'react';
import { FiType, FiBold, FiMessageSquare } from 'react-icons/fi';

interface TextFormattingButtonsProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (newText: string) => void;
}

const TextFormattingButtons: React.FC<TextFormattingButtonsProps> = ({
  textareaRef,
  onTextChange
}) => {
  
  const applyFormatting = (startSymbol: string, endSymbol: string, description: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
      // Apply formatting to selected text
      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(end);
      const formattedText = `${startSymbol}${selectedText}${endSymbol}`;
      const newText = beforeText + formattedText + afterText;
      
      onTextChange(newText);
      
      // Set cursor position after the formatted text
      setTimeout(() => {
        const newCursorPos = start + formattedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    } else {
      // No text selected, insert placeholder
      const beforeText = textarea.value.substring(0, start);
      const afterText = textarea.value.substring(start);
      const placeholder = `${startSymbol}${description}${endSymbol}`;
      const newText = beforeText + placeholder + afterText;
      
      onTextChange(newText);
      
      // Select the placeholder text for easy replacement
      setTimeout(() => {
        const placeholderStart = start + startSymbol.length;
        const placeholderEnd = placeholderStart + description.length;
        textarea.setSelectionRange(placeholderStart, placeholderEnd);
        textarea.focus();
      }, 0);
    }
  };

  const formatSubtitle = () => applyFormatting('*', '*', 'عنوان فرعي');
  const formatRedText = () => applyFormatting('_', '_', 'نص أحمر');
  const formatBoldText = () => applyFormatting('%', '%', 'نص عريض');
  const formatQuote = () => applyFormatting('$', '$', 'اقتباس مهم');

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
      <div className="flex flex-wrap gap-2">
        <div className="text-sm text-gray-600 mb-2 w-full">
          أدوات التنسيق - اختر النص ثم اضغط على الزر المطلوب:
        </div>
        
        <button
          type="button"
          onClick={formatSubtitle}
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          title="عنوان فرعي (*نص*)"
        >
          <FiType size={16} />
          <span>عنوان فرعي</span>
          <code className="text-xs bg-gray-800 px-1 rounded">*نص*</code>
        </button>

        <button
          type="button"
          onClick={formatRedText}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          title="نص أحمر (_نص_)"
        >
          <span className="font-medium">أ</span>
          <span>نص أحمر</span>
          <code className="text-xs bg-red-800 px-1 rounded">_نص_</code>
        </button>

        <button
          type="button"
          onClick={formatBoldText}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          title="نص عريض (%نص%)"
        >
          <FiBold size={16} />
          <span>نص عريض</span>
          <code className="text-xs bg-blue-800 px-1 rounded">%نص%</code>
        </button>

        <button
          type="button"
          onClick={formatQuote}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          title="اقتباس ($نص$)"
        >
          <FiMessageSquare size={16} />
          <span>اقتباس</span>
          <code className="text-xs bg-indigo-800 px-1 rounded">$نص$</code>
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        يمكنك أيضاً كتابة الرموز يدوياً: *عنوان فرعي* | _نص أحمر_ | %نص عريض% | $اقتباس$
      </div>
    </div>
  );
};

export default TextFormattingButtons;