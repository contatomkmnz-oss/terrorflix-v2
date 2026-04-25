import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Propose() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await base44.entities.ContentProposal.create({
      user_email: user?.email,
      suggested_title: title.trim(),
      description: description.trim(),
      status: 'pendente',
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-lg mx-auto">
        <Link to="/Home" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-2">Sugerir Desenho</h1>
        <p className="text-gray-400 text-sm mb-6">Sugira um desenho que você gostaria de ver na plataforma!</p>

        {sent ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-xl">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sugestão Enviada!</h2>
            <p className="text-gray-400">Obrigado pela sua contribuição. Vamos avaliar sua sugestão.</p>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] rounded-xl p-6 space-y-4">
            <Input
              placeholder="Nome do desenho"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#2A2A2A] border-none"
            />
            <Textarea
              placeholder="Descrição (opcional) - conte-nos mais sobre o desenho"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#2A2A2A] border-none h-32"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              className="w-full bg-[#E50914] hover:bg-[#FF3D3D]"
            >
              <Send className="w-4 h-4 mr-2" /> Enviar Sugestão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}