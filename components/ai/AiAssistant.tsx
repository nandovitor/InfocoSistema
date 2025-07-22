

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { useData } from '../../contexts/DataContext';
import { getAiDataAnalysis } from '../../services/geminiService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Como posso ajudar a analisar seus dados hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Destructure only the necessary data for the AI context.
  const { employees, tasks, financeData } = useData();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Create a clean context object with only the data needed for analysis.
      const contextForAi = { employees, tasks, financeData };
      const aiResponseText = await getAiDataAnalysis(currentInput, contextForAi);
      const modelMessage: ChatMessage = { role: 'model', text: aiResponseText };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error("Error fetching AI analysis:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: `Ocorreu um erro: ${error.message || 'Por favor, tente novamente.'}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset on close
  useEffect(() => {
    if(!isOpen) {
        setInput('');
        setIsLoading(false);
        setMessages([
            { role: 'model', text: 'Olá! Como posso ajudar a analisar seus dados hoje?' }
        ]);
    }
  }, [isOpen]);

  const renderAiMessage = (text: string) => {
    let html = '';
    let inList = false;

    const lines = text.split('\n');

    const processInline = (line: string) => line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${processInline(trimmedLine.substring(2))}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            if (trimmedLine) {
                html += `<p>${processInline(line)}</p>`;
            }
        }
    });

    if (inList) {
        html += '</ul>';
    }

    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assistente IA" size="lg">
      <div className="flex flex-col max-h-[70vh] h-auto">
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-md space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
              )}
              
              <div className={cn(
                  'max-w-md p-3 rounded-lg',
                   msg.role === 'user' 
                   ? 'bg-blue-500 text-white rounded-br-none' 
                   : 'bg-gray-200 text-gray-800 rounded-bl-none'
              )}>
                {msg.role === 'user' ? <p>{msg.text}</p> : renderAiMessage(msg.text)}
              </div>

              {msg.role === 'user' && (
                 <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0 flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div className="max-w-md p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
                <Spinner size="sm" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo sobre os dados..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} isLoading={isLoading} disabled={!input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AiAssistant;