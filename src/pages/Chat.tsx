import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Menu, Plus, Send, LogOut, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadConversations();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
      subscribeToMessages(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
    } else {
      setConversations(data || []);
      if (data && data.length > 0 && !activeConversation) {
        setActiveConversation(data[0].id);
      }
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages((data || []) as Message[]);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createNewConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: user?.id, title: 'Новый чат' }])
      .select()
      .single();

    if (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать новый чат',
        variant: 'destructive',
      });
    } else {
      setConversations([data, ...conversations]);
      setActiveConversation(data.id);
      setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConversation) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Insert user message
    const { error: userError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: activeConversation,
          role: 'user',
          content: userMessage,
        },
      ]);

    if (userError) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      // Real API call to analyze message
      const response = await fetch('http://158.160.98.70:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Format analysis response
      const analysisContent = `
📊 **Результат анализа**

🔞 **Рейтинг:** ${data.overall_rating}
📝 **Краткое описание:** ${data.summary}

📈 **Статистика:**
• Всего предложений: ${data.statistics.total_sentences}
• Проблемных: ${data.statistics.problematic_sentences}
• Процент проблемных: ${data.statistics.problematic_percentage}%

🚫 **Нарушения:**
${data.statistics.violations.violence > 0 ? `• Насилие: ${data.statistics.violations.violence}\n` : ''}${data.statistics.violations.profanity > 0 ? `• Ненормативная лексика: ${data.statistics.violations.profanity}\n` : ''}${data.statistics.violations.sexual_content > 0 ? `• Сексуальный контент: ${data.statistics.violations.sexual_content}\n` : ''}${data.statistics.violations.drugs_alcohol > 0 ? `• Наркотики/алкоголь: ${data.statistics.violations.drugs_alcohol}\n` : ''}${data.statistics.violations.fear_elements > 0 ? `• Элементы страха: ${data.statistics.violations.fear_elements}` : ''}
      `.trim();

      await supabase
        .from('messages')
        .insert([
          {
            conversation_id: activeConversation,
            role: 'assistant',
            content: analysisContent,
          },
        ]);
    } catch (error) {
      console.error('API Error:', error);
      
      // Fallback to simple response
      const aiResponse = `⚠️ API временно недоступно. Ваше сообщение: "${userMessage}"`;
      
      await supabase
        .from('messages')
        .insert([
          {
            conversation_id: activeConversation,
            role: 'assistant',
            content: aiResponse,
          },
        ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 glass-panel flex flex-col transition-transform duration-300 ease-in-out border-r border-border',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            QWERTY
          </h2>
        </div>

        <div className="p-4">
          <Button
            onClick={createNewConversation}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Новый чат
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  activeConversation === conv.id
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-muted/50'
                )}
              >
                {conv.title}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate('/scenario-analysis')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Детальный анализ
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate('/admin')}
          >
            <User className="mr-2 h-4 w-4" />
            Админ-панель
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выход
          </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <header className="glass-panel border-b border-border p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {conversations.find((c) => c.id === activeConversation)?.title || 'Чат'}
          </h1>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg">Начните новый разговор</p>
                <p className="text-sm mt-2">Напишите сообщение, чтобы начать</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex animate-message-in',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground message-user'
                      : 'glass-panel message-assistant'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-message-in">
                <div className="glass-panel rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="glass-panel border-t border-border p-4">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              disabled={loading || !activeConversation}
              className="flex-1 bg-muted/50 border-border"
            />
            <Button
              type="submit"
              disabled={loading || !activeConversation || !input.trim()}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
