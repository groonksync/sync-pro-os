import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Users, Video, PlayCircle, ArrowLeft, MessageSquare, Save, FileText, Eraser, 
  Hash, DollarSign, FolderOpen, ExternalLink, Quote, X, Trash2, Search, Mail, 
  Instagram, Youtube, Globe, CreditCard, Phone, Camera, Filter, MoreVertical,
  Calendar, CheckCircle2, Clock, User as UserIcon, Tag, Play, Pause, RotateCcw, 
  Layers, ListChecks, History, Timer, Scissors, Music, Palette, Share2, Activity,
  Calculator as CalcIcon, RefreshCw, AlertCircle, Check, Link, Target, ChevronRight,
  Zap, Copy, Smartphone, Monitor, Info, HardDrive, Megaphone, 
  Globe as GlobeIcon, File, FileVideo, Image as ImageIcon, Folder, ChevronLeft,
  Upload, Download, Bold, Italic, Strikethrough, List, CheckSquare, Table2, Heading1, Heading2,
  Facebook, Smartphone as TiktokIcon, Cloud, Sparkles, Type, Highlighter, TrendingUp, BarChart3,
  AlignLeft, AlignCenter, AlignRight, ListOrdered, ClipboardList, Briefcase, Edit3, Mail as MailIcon,
  Crown, Grid, LayoutGrid, Star, Gift, Shield, Building2, Terminal, Code2, Cpu, PieChart, TrendingDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {} }) => {
  const [viewState, setViewState] = useState('client-list');
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([]);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clientes_editor').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  };

  const uniqueClients = useMemo(() => {
    return (clients || []).filter(c => (c.nombre || '').toLowerCase().includes(clientSearch.toLowerCase()));
  }, [clients, clientSearch]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#0b0c0e] text-white font-sans overflow-hidden">
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#0b0c0e]/80 backdrop-blur-3xl relative z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#10b981] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <Briefcase size={20} className="text-white"/>
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">Sovereign <span className="text-[#10b981] italic">Nexus</span></h1>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-12 space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.5em]">Operational Matrix</p>
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase">Editor Pro</h2>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700" size={20}/>
            <input 
              type="text" 
              value={clientSearch} 
              onChange={e => setClientSearch(e.target.value)} 
              placeholder="Buscar Partner..." 
              className="w-full bg-[#121417] rounded-3xl py-6 pl-16 pr-8 text-sm outline-none border border-white/5 focus:border-[#10b981]/30 transition-all font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {uniqueClients.map((client) => (
            <div key={client.id} className="bg-[#121417] rounded-[2.5rem] p-10 border border-white/5 hover:border-[#10b981]/30 transition-all group relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 bg-[#0b0c0e] rounded-3xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserIcon size={24} className="text-neutral-700 group-hover:text-[#10b981] transition-colors" />
                  </div>
                  <div className="px-4 py-2 bg-[#10b981]/10 rounded-xl text-[8px] font-black text-[#10b981] uppercase tracking-widest border border-[#10b981]/20">
                    Active Partner
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">{client.nombre}</h3>
                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">{client.empresa || 'Independent Production'}</p>
                </div>
                <button className="w-full py-5 bg-[#1a1c20] hover:bg-[#10b981] text-neutral-600 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3">
                  Abrir Nexus <ChevronRight size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MeetingStudio;
