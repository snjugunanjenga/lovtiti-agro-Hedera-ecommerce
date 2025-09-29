'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  Users, 
  Search,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  MicOff,
  PhoneOff,
  VideoOff,
  Settings
} from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
}

interface Chat {
  id: string;
  name: string;
  type: 'individual' | 'group';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
  isOnline: boolean;
}

function MessagingContent() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isAudioCall, setIsAudioCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - in production, this would come from STREAM API
  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Dr. Ahmed Vet',
      type: 'individual',
      participants: ['farmer1', 'vet1'],
      lastMessage: {
        id: '1',
        sender: 'vet1',
        content: 'Your soil test results are ready. The pH level is perfect for tomatoes.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: 'text',
        isRead: false
      },
      unreadCount: 2,
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=40&h=40&fit=crop&crop=face',
      isOnline: true
    },
    {
      id: '2',
      name: 'Green Valley Farmers Group',
      type: 'group',
      participants: ['farmer1', 'farmer2', 'farmer3', 'distributor1'],
      lastMessage: {
        id: '2',
        sender: 'farmer2',
        content: 'The new irrigation system is working perfectly!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        type: 'text',
        isRead: true
      },
      unreadCount: 0,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      isOnline: false
    },
    {
      id: '3',
      name: 'Transport Solutions Ltd',
      type: 'individual',
      participants: ['farmer1', 'transporter1'],
      lastMessage: {
        id: '3',
        sender: 'transporter1',
        content: 'Your delivery is on schedule. ETA: 2 hours',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        type: 'text',
        isRead: true
      },
      unreadCount: 0,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      isOnline: true
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'vet1',
      content: 'Hello! I received your soil sample. Let me analyze it for you.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'text',
      isRead: true
    },
    {
      id: '2',
      sender: 'farmer1',
      content: 'Thank you! I\'m looking forward to your analysis.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
      type: 'text',
      isRead: true
    },
    {
      id: '3',
      sender: 'vet1',
      content: 'Your soil test results are ready. The pH level is perfect for tomatoes.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'text',
      isRead: false
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'farmer1',
        content: message,
        timestamp: new Date(),
        type: 'text',
        isRead: false
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVideoCall = () => {
    setIsVideoCall(true);
    setIsAudioCall(false);
  };

  const startAudioCall = () => {
    setIsAudioCall(true);
    setIsVideoCall(false);
  };

  const endCall = () => {
    setIsVideoCall(false);
    setIsAudioCall(false);
  };

  const activeChatData = chats.find(chat => chat.id === activeChat);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Messages</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Chat List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Your active conversations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChat(chat.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                        activeChat === chat.id ? 'border-green-500 bg-green-50' : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={chat.avatar}
                            alt={chat.name}
                            className="w-10 h-10 rounded-full"
                          />
                          {chat.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {chat.name}
                            </h4>
                            {chat.unreadCount > 0 && (
                              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage?.content}
                          </p>
                          <p className="text-xs text-gray-400">
                            {chat.lastMessage?.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              {activeChatData ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={activeChatData.avatar}
                          alt={activeChatData.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h3 className="font-medium">{activeChatData.name}</h3>
                          <p className="text-sm text-gray-500">
                            {activeChatData.isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={startAudioCall}>
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={startVideoCall}>
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender === 'farmer1' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              msg.sender === 'farmer1'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {msg.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 relative">
                        <Input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="pr-12"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRecording(!isRecording)}
                      >
                        {isRecording ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                      <Button onClick={handleSendMessage} disabled={!message.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500">
                      Choose a chat from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Video Call Modal */}
        {isVideoCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <Video className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Video Call with {activeChatData?.name}
                </h3>
                <p className="text-gray-500 mb-4">
                  Starting video call...
                </p>
                <div className="flex space-x-2 justify-center">
                  <Button onClick={endCall} variant="outline">
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Call Modal */}
        {isAudioCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <Phone className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Audio Call with {activeChatData?.name}
                </h3>
                <p className="text-gray-500 mb-4">
                  Starting audio call...
                </p>
                <div className="flex space-x-2 justify-center">
                  <Button onClick={endCall} variant="outline">
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagingPage() {
  return <MessagingContent />;
}
