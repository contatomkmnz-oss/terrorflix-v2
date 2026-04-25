import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsers() {
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/Admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold flex-1">Usuários</h1>
          <span className="text-sm text-gray-400">{users.length} usuários</span>
        </div>

        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#E50914] flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">{u.full_name?.[0] || u.email?.[0] || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.full_name || 'Sem nome'}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-[#FFC107]/20 text-[#FFC107]' : 'bg-white/10 text-gray-300'}`}>
                  {u.role || 'user'}
                </span>
                {u.created_date && (
                  <p className="text-[10px] text-gray-500 mt-1">{format(new Date(u.created_date), 'dd/MM/yyyy')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}