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
  const formatGrayText = () => applyFormatting('&', '&', 'نص رمادي فاتح');
  const formatBulletTitle = () => applyFormatting('(', ')', 'عنوان مع نقطة');
  const formatMarkdownBold = () => applyFormatting('**', '**', 'نص عريض');
  const formatMarkdownItalic = () => applyFormatting('*', '*', 'نص مائل');
  const formatMarkdownUnderline = () => applyFormatting('__', '__', 'نص تحته خط');
  const formatMarkdownStrikethrough = () => applyFormatting('~~', '~~', 'نص مشطوب');
  const formatCodeBlock = () => applyFormatting('```', '```', 'كتلة كود');
  const formatInlineCode = () => applyFormatting('`', '`', 'كود مضمن');
  const formatLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    const linkText = selectedText || 'نص الرابط';
    const formattedText = `[${linkText}](URL)`;
    const newText = beforeText + formattedText + afterText;
    
    onTextChange(newText);
    
    // Select the URL part for easy replacement
    setTimeout(() => {
      const urlStart = start + linkText.length + 3; // After [text](
      const urlEnd = urlStart + 3; // Select "URL"
      textarea.setSelectionRange(urlStart, urlEnd);
      textarea.focus();
    }, 0);
  };

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
      <div className="flex flex-wrap gap-2">
        <div className="text-sm text-gray-600 mb-2 w-full">
          أدوات التنسيق - اختر النص ثم اضغط على الزر المطلوب:
        </div>
        
        {/* Original formatting buttons */}
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

        {/* New formatting buttons */}
        <button
          type="button"
          onClick={formatGrayText}
          className="flex items-center gap-2 px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors text-sm"
          title="نص رمادي فاتح (&نص&)"
        >
          <span className="font-light">أ</span>
          <span>نص رمادي</span>
          <code className="text-xs bg-gray-600 px-1 rounded">&نص&</code>
        </button>

        <button
          type="button"
          onClick={formatBulletTitle}
          className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm"
          title="عنوان مع نقطة ((نص))"
        >
          <span className="font-bold">•</span>
          <span>عنوان مع نقطة</span>
          <code className="text-xs bg-gray-700 px-1 rounded">(نص)</code>
        </button>

        {/* Markdown formatting buttons */}
        <button
          type="button"
          onClick={formatMarkdownBold}
          className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
          title="نص عريض (**نص**)"
        >
          <FiBold size={16} />
          <span>عريض</span>
          <code className="text-xs bg-orange-800 px-1 rounded">**نص**</code>
        </button>

        <button
          type="button"
          onClick={formatMarkdownItalic}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
          title="نص مائل (*نص*)"
        >
          <span className="italic font-medium">أ</span>
          <span>مائل</span>
          <code className="text-xs bg-purple-800 px-1 rounded">*نص*</code>
        </button>

        <button
          type="button"
          onClick={formatMarkdownUnderline}
          className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-sm"
          title="نص تحته خط (__نص__)"
        >
          <span className="underline font-medium">أ</span>
          <span>تحته خط</span>
          <code className="text-xs bg-teal-800 px-1 rounded">__نص__</code>
        </button>

        <button
          type="button"
          onClick={formatMarkdownStrikethrough}
          className="flex items-center gap-2 px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm"
          title="نص مشطوب (~~نص~~)"
        >
          <span className="line-through font-medium">أ</span>
          <span>مشطوب</span>
          <code className="text-xs bg-pink-800 px-1 rounded">~~نص~~</code>
        </button>

        <button
          type="button"
          onClick={formatCodeBlock}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          title="كتلة كود (```كود```)"
        >
          <span className="font-mono text-xs">{'{}'}</span>
          <span>كتلة كود</span>
          <code className="text-xs bg-green-800 px-1 rounded">```كود```</code>
        </button>

        <button
          type="button"
          onClick={formatInlineCode}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
          title="كود مضمن (`كود`)"
        >
          <span className="font-mono text-xs">{'<>'}</span>
          <span>كود مضمن</span>
          <code className="text-xs bg-yellow-800 px-1 rounded">`كود`</code>
        </button>

        <button
          type="button"
          onClick={formatLink}
          className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors text-sm"
          title="رابط ([نص](URL))"
        >
          <span className="font-medium">🔗</span>
          <span>رابط</span>
          <code className="text-xs bg-cyan-800 px-1 rounded">[نص](URL)</code>
        </button>
      </div>
    </div>
  );
};

export default TextFormattingButtons;