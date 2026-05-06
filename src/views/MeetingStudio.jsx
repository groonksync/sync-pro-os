  // AGENCIA DE MARKETING: ESTADOS Y LÓGICA
  const [agencyClients, setAgencyClients] = useState([]);
  const [activeAgencyClient, setActiveAgencyClient] = useState(null);
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [agencySearch, setAgencySearch] = useState('');

  useEffect(() => {
    if (viewState === 'agency-hub' || viewState === 'agency-session') {
      fetchAgencyClients();
    }
  }, [viewState, activeAgencyPlan]);

  const fetchAgencyClients = async () => {
    try {
      let query = supabase.from('clientes_agencia').select('*');
      if (activeAgencyPlan) {
        query = query.eq('plan', activeAgencyPlan);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setAgencyClients(data || []);
    } catch (e) { console.error("Error fetching agency clients:", e); }
  };

  const handleCreateAgencyClient = async () => {
    if (!newCompany.nombre_empresa) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('clientes_agencia').insert([{
        nombre_empresa: newCompany.nombre_empresa,
        dueño: newCompany.dueño,
        email: newCompany.email,
        telefono: newCompany.telefono,
        plan: newCompany.plan || activeAgencyPlan || 'Básico'
      }]);
      if (error) throw error;
      await fetchAgencyClients();
      setIsCompanyModalOpen(false);
      setNewCompany({ nombre_empresa: '', dueño: '', email: '', telefono: '', plan: 'Básico' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const openAgencyProfile = (company) => {
    setSelectedCompany(company);
    fetchStrategies(company.id);
    setViewState('agency-session');
  };

  const [strategies, setStrategies] = useState([]);
  const fetchStrategies = async (companyId) => {
    try {
      const { data, error } = await supabase
        .from('estrategias_agencia')
        .select('*')
        .eq('cliente_agencia_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStrategies(data || []);
    } catch (e) { console.error(e); }
  };

  const createStrategy = async () => {
    const title = prompt('Título de la estrategia:', 'Plan Estratégico');
    if (!title) return;
    const newStrat = { 
      id: crypto.randomUUID(), 
      cliente_agencia_id: selectedCompany.id, 
      titulo_estrategia: title,
      contenido: '<p>Iniciando nueva fase estratégica...</p>',
      total_time: 0
    };
    try { 
      await supabase.from('estrategias_agencia').insert(newStrat); 
      await fetchStrategies(selectedCompany.id);
      setActiveStrategy(newStrat);
      setEditorContent(newStrat.contenido);
      setTime(0);
      setViewState('agency-editor');
    } catch (error) { alert(error.message); }
  };

  const saveStrategy = async () => {
    if (!activeStrategy) return;
    setLoading(true);
    try {
      const finalContent = editorRef.current ? editorRef.current.innerHTML : activeStrategy.contenido;
      const updated = { 
        ...activeStrategy, 
        contenido: finalContent,
        total_time: time, 
        updated_at: new Date().toISOString() 
      };
      const { error } = await supabase.from('estrategias_agencia').upsert(updated);
      if (error) throw error;
      await fetchStrategies(selectedCompany.id); 
      setViewState('agency-session'); 
      setActiveStrategy(null);
      setIsTimerRunning(false);
      alert("Estrategia guardada en la bóveda de la Agencia.");
    } catch (error) { alert("Error al guardar: " + error.message); }
    setLoading(false);
  };

  const filteredAgencyClients = useMemo(() => {
    return agencyClients.filter(c => 
      normalizeText(c.nombre_empresa).includes(normalizeText(agencySearch)) ||
      normalizeText(c.dueño).includes(normalizeText(agencySearch))
    );
  }, [agencyClients, agencySearch]);

  const colors = {
    bg: isLight ? 'bg-[#f8fafc]' : 'bg-[#0b0c0e]',
    card: isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#121418] border-white/5 shadow-2xl',
    text: isLight ? 'text-slate-900' : 'text-white',
    textMuted: isLight ? 'text-slate-500' : 'text-neutral-500',
    border: isLight ? 'border-slate-200' : 'border-white/5',
    input: isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#0d0f12] border-white/5 text-white',
    innerBg: isLight ? 'bg-slate-50' : 'bg-[#080808]'
  };

  return (
    <div className={`flex flex-col h-screen w-full ${colors.bg} ${colors.text} overflow-hidden font-sans transition-colors duration-500`}>
      
      {/* NAVEGACIÓN MAESTRA: EDITOR VS AGENCIA */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 relative z-50 bg-black/20 backdrop-blur-3xl">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#10b981] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
               <Briefcase size={20} className="text-white"/>
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Sovereign <span className="text-neutral-500 italic">OS</span></h1>
         </div>
         
         <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            <button onClick={() => { setViewState('client-list'); setActiveAgencyPlan(null); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState === 'client-list' || viewState === 'session' ? 'bg-[#10b981] text-white shadow-lg' : 'text-neutral-600 hover:text-white'}`}>
               <div className="flex items-center gap-2"><Video size={14}/> Editor Pro</div>
            </button>
            <button onClick={() => { setViewState('agency-hub'); if(!activeAgencyPlan) setActiveAgencyPlan('Básico'); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState.includes('agency') ? 'bg-amber-500 text-white shadow-lg' : 'text-neutral-600 hover:text-white'}`}>
               <div className="flex items-center gap-2"><Briefcase size={14}/> Agencia de Marketing</div>
            </button>
         </div>

         <div className="flex items-center gap-6">
            <button className="text-neutral-700 hover:text-white transition-all"><Calendar size={20}/></button>
            <button className="text-neutral-700 hover:text-white transition-all"><Search size={20}/></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 border-2 border-white/10"></div>
         </div>
      </nav>
      
      {/* VISTA: CONTROL DE CLIENTES (EDITOR PRO) */}
      {viewState === 'client-list' && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-1000 relative">
          <div className="flex-1 overflow-y-auto mac-scrollbar p-10 space-y-10 max-w-[1900px] mx-auto w-full relative z-10">
            <header className={`${colors.card} rounded-[3rem] p-10 shadow-2xl border border-white/5 relative overflow-hidden group animate-in slide-in-from-top duration-1000`}>
               <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#10b981]/5 to-transparent pointer-events-none"></div>
               <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className="space-y-3">
                    <p className={`text-[10px] text-[#10b981] font-black uppercase tracking-[0.8em] flex items-center gap-3 animate-pulse`}>
                       <Crown size={14}/> Operational Matrix • Elite Edition
                    </p>
                    <h2 className={`text-6xl font-black ${colors.text} tracking-tighter uppercase leading-[0.8]`}>
                       Control de <br/><span className={isLight ? 'text-slate-200' : 'text-white/10'}>Clientes</span>
                    </h2>
                  </div>
                  <div className="flex gap-8">
                     <button onClick={() => setIsClientModalOpen(true)} className="px-12 py-5 bg-[#10b981] text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-4">
                       <Plus size={20} strokeWidth={3}/> Nuevo Cliente
                     </button>
                  </div>
               </div>
               <div className="grid grid-cols-4 gap-8 relative z-10">
                  {['Revenue Velocity', 'Client Seniority', 'Loyalty Flow', 'Retention Rate'].map((label, i) => (
                     <div key={i} className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 group hover:bg-[#10b981]/5 transition-all">
                        <div className="flex justify-between items-center mb-4"><p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">{label}</p><TrendingUp size={12} className="text-[#10b981]"/></div>
                        <div className="flex flex-col gap-1 w-full"><div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#10b981]" style={{ width: `${60 + i*10}%` }}></div></div><p className="text-xl font-black text-white font-mono tracking-tighter">{85 + i*3}%</p></div>
                     </div>
                  ))}
               </div>
            </header>

            <div className="flex gap-6 items-center">
              <div className="relative group flex-1">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-800 group-focus-within:text-[#10b981] transition-colors" size={24}/>
                <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Filtrar clientes en la matriz..." className={`w-full ${colors.input} rounded-[2.5rem] py-6 pl-20 pr-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all font-bold shadow-2xl`} />
              </div>
            </div>

            <div className={`${colors.card} rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5`}>
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-white/5 bg-white/[0.01]">
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">Cliente</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">Modalidad</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em] text-right">Inversión</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em] text-right">Comandos</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {uniqueClients.map((client) => (
                       <tr key={client.id} onClick={() => openClientProfile(client)} className="group hover:bg-[#10b981]/[0.03] transition-all cursor-pointer">
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-xl">{client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={24} className="text-neutral-800 m-auto mt-4" />}</div>
                                <div><p className={`text-base font-black ${colors.text} uppercase tracking-tighter mb-1`}>{client.nombre}</p><p className="text-[10px] text-neutral-600 font-bold uppercase">{client.email || 'Global Partner'}</p></div>
                             </div>
                          </td>
                          <td className="px-10 py-8"><div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[8px] font-black text-amber-500 uppercase flex items-center gap-2"><Crown size={12}/> VIP Tier</div></td>
                          <td className="px-10 py-8 text-right"><p className="text-base font-black text-white font-mono">$1,200.00</p></td>
                          <td className="px-10 py-8 text-right">
                             <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-500"><MoreVertical size={16}/></button>
                                <button className="p-3 bg-white/5 hover:bg-[#10b981] rounded-xl text-white"><ChevronRight size={16}/></button>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: AGENCIA DE MARKETING HUB (DEDICADA) */}
      {viewState === 'agency-hub' && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-1000 bg-[#0b0c0e]">
           <div className="flex-1 overflow-y-auto mac-scrollbar p-12 space-y-16 max-w-[1900px] mx-auto w-full relative">
              <header className="relative z-10 flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="w-2 h-10 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Agencia de <span className="text-neutral-500 italic">Marketing</span></h2>
                 </div>
                 <button onClick={() => setIsCompanyModalOpen(true)} className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-4 shadow-[0_15px_35px_rgba(245,158,11,0.3)]"><Plus size={18} strokeWidth={3}/> Nuevo Proyecto</button>
              </header>

              {/* MATRIZ DE PLANES */}
              <div className="grid grid-cols-4 gap-6">
                 {[
                   { name: 'Básico', icon: <Shield size={18}/>, color: '#3b82f6' },
                   { name: 'Intermedio', icon: <Zap size={18}/>, color: '#10b981' },
                   { name: 'Avanzado', icon: <Crown size={18}/>, color: '#a855f7' },
                   { name: 'Personalizado', icon: <Sparkles size={18}/>, color: '#f59e0b' }
                 ].map((p, i) => (
                   <div key={i} onClick={() => setActiveAgencyPlan(p.name)} className={`group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all cursor-pointer ${activeAgencyPlan === p.name ? 'bg-white/[0.05] border-amber-500/50 shadow-[0_20px_50px_rgba(245,158,11,0.1)]' : ''}`}>
                      <div className="flex justify-between items-center mb-6">
                         <div className={`p-4 rounded-2xl ${activeAgencyPlan === p.name ? 'bg-amber-500 text-white' : 'bg-white/5 text-neutral-500'}`}>{p.icon}</div>
                         <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: p.color }}></div>
                      </div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">{p.name}</h4>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{agencyClients.filter(c => c.plan === p.name).length} Proyectos Activos</p>
                   </div>
                 ))}
              </div>

              {/* LISTADO DE PROYECTOS DE AGENCIA */}
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-neutral-700 uppercase tracking-[0.5em]">Directorio Estratégico • {activeAgencyPlan}</h3>
                    <div className="relative w-96">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={16}/>
                       <input type="text" value={agencySearch} onChange={e=>setAgencySearch(e.target.value)} placeholder="Buscar empresa..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-amber-500/50 transition-all" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAgencyClients.map((company, i) => (
                       <div key={company.id} onClick={() => openAgencyProfile(company)} className="group bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/[0.03] to-transparent pointer-events-none"></div>
                          <div className="flex items-center gap-6 mb-8">
                             <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-amber-500 border border-white/5 shadow-2xl group-hover:scale-110 transition-all"><Building2 size={28}/></div>
                             <div><h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{company.nombre_empresa}</h4><p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Socio: {company.dueño}</p></div>
                          </div>
                          <div className="flex gap-3">
                             <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/5 text-center"><p className="text-[7px] text-neutral-700 font-black uppercase mb-1">Status</p><p className="text-[9px] font-black text-[#10b981] uppercase">Ejecución</p></div>
                             <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/5 text-center"><p className="text-[7px] text-neutral-700 font-black uppercase mb-1">Estrategias</p><p className="text-[9px] font-black text-white uppercase">12 Activas</p></div>
                          </div>
                       </div>
                    ))}
                    {filteredAgencyClients.length === 0 && (
                       <div className="col-span-3 py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                          <p className="text-neutral-700 font-black uppercase tracking-widest">No hay proyectos en el plan {activeAgencyPlan}</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* VISTA: ESTRATEGIA DE AGENCIA (PERFIL DE EMPRESA) */}
      {viewState === 'agency-session' && selectedCompany && (
        <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-500">
           <header className="h-24 border-b border-white/5 px-10 flex items-center justify-between bg-black/40 backdrop-blur-3xl shrink-0">
              <div className="flex items-center gap-8">
                 <button onClick={() => setViewState('agency-hub')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-amber-500 border border-white/10 transition-all"><ArrowLeft size={24}/></button>
                 <div><h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{selectedCompany.nombre_empresa}</h3><p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Strategic War Room • {selectedCompany.plan}</p></div>
              </div>
              <button onClick={createStrategy} className="px-10 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-amber-500 hover:text-white transition-all shadow-2xl"><Sparkles size={18}/> Iniciar Nueva Estrategia</button>
           </header>
           
           <div className="flex-1 overflow-y-auto mac-scrollbar p-10 space-y-10 max-w-[1500px] mx-auto w-full">
              {strategies.map(s => (
                 <div key={s.id} onClick={() => { setActiveStrategy(s); setEditorContent(s.contenido); setTime(s.total_time); setViewState('agency-editor'); }} className="group bg-[#121418] border border-white/5 rounded-[2rem] p-8 flex items-center justify-between hover:border-amber-500/30 transition-all cursor-pointer shadow-2xl">
                    <div className="flex items-center gap-10">
                       <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-amber-500 border border-white/5 group-hover:scale-110 transition-all"><Target size={28}/></div>
                       <div className="space-y-2">
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{s.titulo_estrategia}</h4>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-600 uppercase tracking-widest"><Calendar size={12}/> {new Date(s.created_at).toLocaleDateString()} <span className="w-1 h-1 rounded-full bg-neutral-800"></span> <Clock size={12}/> {formatTime(s.total_time)}</div>
                       </div>
                    </div>
                    <ChevronRight size={24} className="text-neutral-800 group-hover:text-amber-500 transition-all"/>
                 </div>
              ))}
              {strategies.length === 0 && <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] text-neutral-700 font-black uppercase tracking-widest">No hay estrategias registradas</div>}
           </div>
        </div>
      )}

      {/* VISTA: EDITOR DE ESTRATEGIA (AGENCY EDITOR) */}
      {viewState === 'agency-editor' && activeStrategy && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
           <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 shrink-0">
              <div className="flex items-center gap-6">
                 <button onClick={saveStrategy} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-amber-500 transition-all"><ArrowLeft size={20}/></button>
                 <div><h3 className="text-lg font-black text-white uppercase">{selectedCompany.nombre_empresa}</h3><p className="text-[8px] text-amber-500 font-black uppercase tracking-widest">{activeStrategy.titulo_estrategia}</p></div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="bg-[#080808] border border-white/5 rounded-xl px-5 py-2 flex items-center gap-4"><p className="text-xl font-mono font-black text-white leading-none">{formatTime(time)}</p><button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTimerRunning ? 'bg-amber-500' : 'bg-white text-black'}`}>{isTimerRunning ? <Pause size={14}/> : <Play size={14}/>}</button></div>
                 <button onClick={saveStrategy} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-xl"><Save size={16}/> Guardar Plan</button>
              </div>
           </header>
           
           <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
              {/* TOOLS SIDEBAR */}
              <div className="w-[300px] shrink-0 space-y-4 overflow-y-auto pr-2">
                 <div className="bg-[#121418] border border-white/5 rounded-2xl p-5 shadow-2xl">
                    <p className="text-[10px] text-neutral-600 font-black uppercase mb-4 flex items-center gap-2"><Target size={14} className="text-amber-500"/> ROAS HUD</p>
                    <div className="bg-[#080808] p-4 rounded-xl border border-white/5 text-right text-2xl font-mono font-black text-white mb-4 shadow-inner">{calcDisplay}</div>
                    <div className="grid grid-cols-4 gap-2">
                       {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (
                          <button key={btn} onClick={() => handleCalc(btn)} className="h-10 rounded-lg text-[10px] font-black bg-white/5 text-neutral-500 hover:bg-white/10 transition-all">{btn}</button>
                       ))}
                       <button onClick={()=>handleCalc('=')} className="h-10 rounded-lg text-[10px] font-black bg-amber-500 text-white col-span-2 shadow-lg">=</button>
                    </div>
                 </div>
                 <div className="bg-[#121418] border border-white/5 rounded-2xl p-5 flex-1 min-h-[200px] flex flex-col shadow-2xl"><p className="text-[10px] text-neutral-600 font-black uppercase mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-amber-500"/> Objetivos KPI</p><textarea className="w-full flex-1 bg-[#080808] border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none resize-none" placeholder="Definir metas de la campaña..." /></div>
              </div>

              {/* EDITOR ESTRATÉGICO */}
              <div className="flex-1 bg-[#121418] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col relative shadow-2xl">
                 <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-[#080808]">
                    <div className="flex items-center gap-4">
                       <button onMouseDown={(e)=>formatText('bold',null,e)} className="p-2 text-neutral-600 hover:text-white"><Bold size={18}/></button>
                       <button onMouseDown={(e)=>formatText('insertUnorderedList',null,e)} className="p-2 text-neutral-600 hover:text-white"><List size={18}/></button>
                    </div>
                    <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                       {['estrategia', 'drive', 'tasks'].map(tab => (
                          <button key={tab} className="px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest text-neutral-700 hover:text-white transition-all">{tab}</button>
                       ))}
                    </div>
                 </div>
                 <div className="flex-1 relative overflow-hidden bg-[#050505]">
                    <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="w-full h-full p-12 text-white font-medium text-lg leading-relaxed outline-none mac-scrollbar overflow-y-auto max-w-[900px] mx-auto" dangerouslySetInnerHTML={{ __html: activeStrategy.contenido }} />
                    <button onClick={()=>setShowAIModal(true)} className="absolute bottom-8 right-8 w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all"><Sparkles size={24}/></button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* VISTA: WAR ROOM / EDITOR (VIDEO EDITOR) */}
      {viewState === 'session' && activeMeeting && (
        <div className={`flex-1 flex flex-col overflow-hidden ${colors.bg} animate-in fade-in duration-500`}>
          <header className={`px-6 py-4 border-b ${colors.card} flex items-center justify-between shrink-0 relative z-50`}>
            <div className="flex items-center gap-6">
              <button onClick={saveMeeting} className={`w-10 h-10 ${isLight ? 'bg-slate-100' : 'bg-white/5'} rounded-xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all`}><ArrowLeft size={20}/></button>
              <div><div className="flex items-center gap-3"><h3 className={`text-lg font-black ${colors.text} uppercase leading-none`}>{activeClient?.nombre}</h3><span className="text-neutral-800 text-xl font-thin">/</span><input type="text" value={activeMeeting.session_title} onChange={e=>setActiveMeeting({...activeMeeting, session_title: e.target.value})} className="bg-transparent text-lg font-black text-[#10b981] uppercase outline-none w-auto" /></div><p className={`text-[8px] ${colors.textMuted} font-black uppercase tracking-[0.4em] mt-1`}>Sovereign Obsidian • Professional War Room</p></div>
            </div>
            <div className="flex items-center gap-4">
               <div className={`flex items-center gap-4 ${colors.innerBg} border ${colors.border} rounded-xl px-5 py-2 shadow-2xl`}><p className={`text-xl font-mono font-black ${colors.text} leading-none`}>{formatTime(time)}</p><button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-[#10b981] text-white shadow-lg' : 'bg-white text-black'}`}>{isTimerRunning ? <Pause size={14} strokeWidth={3}/> : <Play size={14} strokeWidth={3} fill="currentColor"/>}</button></div>
               <button onClick={saveMeeting} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all shadow-xl"><Save size={16} strokeWidth={3}/> Finalizar</button>
            </div>
          </header>

          <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
            <div className="w-[300px] h-full shrink-0 flex flex-col space-y-4 overflow-y-auto mac-scrollbar pr-2">
               {/* CALCULADORA HUD */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 shadow-xl`}>
                  <div className="flex items-center justify-between mb-4"><p className={`text-[10px] ${colors.textMuted} font-black uppercase flex items-center gap-2`}><CalcIcon size={14} className="text-[#10b981]"/> Business HUD</p><button onClick={()=>setCalcDisplay('0')} className="text-neutral-500 hover:text-[#10b981]"><RefreshCw size={12}/></button></div>
                  <div className={`${colors.innerBg} border ${colors.border} rounded-xl p-4 text-right text-3xl font-mono font-black ${colors.text} mb-4 truncate shadow-inner`}>{calcDisplay}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn)} className={`h-11 rounded-lg text-[11px] font-black transition-all ${btn === '=' ? 'bg-[#10b981] text-white col-span-2' : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-neutral-600'} hover:scale-105`}>{btn}</button>
                    ))}
                    <button onClick={()=>handleCalc('=')} className="h-11 rounded-lg text-[11px] font-black bg-[#10b981] text-white transition-all col-span-2 shadow-lg">=</button>
                  </div>
               </div>
               <div className={`${colors.card} rounded-[1.5rem] p-5 flex-1 flex flex-col min-h-[120px] shadow-xl`}><p className={`text-[10px] ${colors.textMuted} font-black uppercase mb-4 flex items-center gap-2`}><Target size={14} className="text-[#10b981]"/> Objectives</p><textarea value={activeMeeting.session_objective || ''} onChange={e=>setActiveMeeting({...activeMeeting, session_objective: e.target.value})} placeholder="Misión de hoy..." className={`w-full flex-1 ${colors.innerBg} border ${colors.border} rounded-xl p-4 text-sm outline-none resize-none`} /></div>
            </div>

            <div className={`flex-1 flex flex-col ${colors.card} rounded-[2rem] overflow-hidden shadow-2xl relative`}>
               <div className={`flex items-center justify-between px-8 py-4 ${isLight ? 'bg-slate-50' : 'bg-[#080808]'} border-b shrink-0`}>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 pr-4 border-r border-white/10">
                        <button onMouseDown={(e) => formatText('bold', null, e)} className="p-2 text-neutral-600 hover:text-[#10b981] rounded-lg transition-all"><Bold size={16}/></button>
                        <button onMouseDown={(e) => formatText('insertUnorderedList', null, e)} className="p-2 text-neutral-600 hover:text-[#10b981] rounded-lg transition-all"><List size={16}/></button>
                     </div>
                  </div>
                  <div className={`flex ${isLight ? 'bg-slate-100' : 'bg-black/50'} rounded-xl p-1 border border-white/5`}>
                     {['editor', 'drive', 'tasks'].map(tab => (
                        <button key={tab} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${sessionTab === tab ? 'bg-[#10b981] text-white shadow-lg' : isLight ? 'text-slate-400 hover:text-slate-900' : 'text-neutral-700 hover:text-white'}`}>{tab.toUpperCase()}</button>
                     ))}
                  </div>
               </div>
               <div className={`flex-1 relative overflow-hidden ${isLight ? 'bg-white' : 'bg-[#050505]'}`}>
                  <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className={`w-full h-full p-12 ${isLight ? 'text-slate-900' : 'text-white'} font-medium text-lg leading-relaxed outline-none mac-scrollbar overflow-y-auto max-w-[1000px] mx-auto`} dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})} />
                  <button onClick={() => setShowAIModal(true)} className="absolute bottom-8 right-8 w-14 h-14 bg-[#10b981] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all"><Sparkles size={24}/></button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES DE AGENCIA */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-8 animate-in zoom-in duration-300">
           <div className="bg-[#121418] border-t-4 border-t-amber-500 rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Sovereign <span className="text-amber-500">Agency</span></h3>
                <div className="space-y-4">
                  <input type="text" value={newCompany.nombre_empresa} onChange={e=>setNewCompany({...newCompany, nombre_empresa: e.target.value})} placeholder="Nombre de la empresa..." className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-lg text-white outline-none" />
                  <input type="text" value={newCompany.dueño} onChange={e=>setNewCompany({...newCompany, dueño: e.target.value})} placeholder="Nombre del socio/dueño..." className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-lg text-white outline-none" />
                  <select value={newCompany.plan} onChange={e=>setNewCompany({...newCompany, plan: e.target.value})} className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-lg text-white outline-none">
                     <option value="Básico">Plan Básico</option>
                     <option value="Intermedio">Plan Intermedio</option>
                     <option value="Avanzado">Plan Avanzado</option>
                     <option value="Personalizado">Plan Personalizado</option>
                  </select>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-6 text-neutral-600 font-black uppercase text-[10px] tracking-widest">Descartar</button>
                   <button onClick={handleCreateAgencyClient} className="flex-[2] py-6 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Lanzar Proyecto</button>
                </div>
           </div>
        </div>
      )}

      {/* MODAL CLIENTE EDITOR PRO */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in zoom-in duration-300">
           <div className={`${colors.card} border-t-4 border-t-[#10b981] rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl`}>
                <h3 className={`text-3xl font-black ${colors.text} uppercase tracking-tighter leading-none`}>Sovereign <span className="text-[#10b981]">Nexus</span></h3>
                <div className="space-y-4">
                  <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} />
                  <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="Email corporativo..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} />
                  <input type="text" value={newClient.pais} onChange={e=>setNewClient({...newClient, pais: e.target.value})} placeholder="País/Región..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsClientModalOpen(false)} className={`flex-1 py-6 ${colors.textMuted} font-black uppercase text-[10px] tracking-widest`}>Descartar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-6 bg-[#10b981] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg">Guardar Perfil</button>
                </div>
           </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-10 animate-in zoom-in duration-300">
          <div className="bg-[#121418] border-t-4 border-t-[#10b981] rounded-[4rem] p-16 w-full max-w-3xl shadow-2xl">
            <h4 className="text-3xl font-black text-white uppercase mb-8 flex items-center gap-4"><Sparkles className="text-[#10b981]" size={28}/> IA Oracle</h4>
            <textarea autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-[#0d0f12] border border-white/5 rounded-[2.5rem] p-8 text-lg text-white outline-none h-48 resize-none mb-8" placeholder="Pide una mejora creativa..." />
            <div className="flex gap-8"><button onClick={() => setShowAIModal(false)} className="flex-1 py-6 text-neutral-600 font-black uppercase text-[10px]">Cerrar</button><button onClick={handleAISuggestion} className="flex-[2] py-6 bg-[#10b981] text-white font-black rounded-[2.5rem] uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-lg">Ejecutar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
    </div>
  );
};
export default MeetingStudio;
