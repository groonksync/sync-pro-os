import React, { useState, useEffect } from 'react';
import { ListChecks, Plus, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { getTaskLists, getTasks } from '../lib/googleApi';

const GoogleTasks = ({ token }) => {
  const [taskLists, setTaskLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadTaskLists();
    }
  }, [token]);

  const loadTaskLists = async () => {
    setLoading(true);
    try {
      const lists = await getTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0) {
        setSelectedList(lists[0].id);
        loadTasks(lists[0].id);
      }
    } catch (error) {
      console.error('Error loading task lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (listId) => {
    setLoading(true);
    try {
      const items = await getTasks(token, listId);
      setTasks(items);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="p-4 text-center">
      <p className="text-[10px] text-neutral-600 font-black uppercase">Vincular Google para ver tareas</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <select 
          value={selectedList || ''} 
          onChange={(e) => { setSelectedList(e.target.value); loadTasks(e.target.value); }}
          className="bg-transparent text-[8px] font-black text-neutral-400 uppercase outline-none cursor-pointer"
        >
          {taskLists.map(list => (
            <option key={list.id} value={list.id} className="bg-black">{list.title}</option>
          ))}
        </select>
        <button onClick={() => selectedList && loadTasks(selectedList)} className="text-neutral-700 hover:text-white transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 mac-scrollbar">
        {tasks.length > 0 ? tasks.map(task => (
          <div key={task.id} className="flex items-start gap-3 p-2 bg-black border border-white/5 rounded-xl group">
            <div className="mt-0.5">
              {task.status === 'completed' ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <Circle size={14} className="text-neutral-800 group-hover:text-neutral-600" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className={`text-[10px] font-medium leading-tight ${task.status === 'completed' ? 'text-neutral-700 line-through' : 'text-neutral-300'}`}>
                {task.title}
              </p>
              {task.notes && <p className="text-[8px] text-neutral-600 mt-1 italic truncate">{task.notes}</p>}
            </div>
          </div>
        )) : (
          <p className="text-[10px] text-neutral-800 text-center py-4">No hay tareas pendientes</p>
        )}
      </div>
    </div>
  );
};

export default GoogleTasks;
